package com.superapp.wallet.service;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.wallet.dto.*;
import com.superapp.wallet.entity.MerchantBankAccount;
import com.superapp.wallet.entity.MerchantPayoutRequest;
import com.superapp.wallet.entity.MerchantWallet;
import com.superapp.wallet.entity.MerchantWalletLedger;
import com.superapp.wallet.enums.LedgerEntryType;
import com.superapp.wallet.enums.PayoutMode;
import com.superapp.wallet.enums.PayoutProvider;
import com.superapp.wallet.enums.PayoutStatus;
import com.superapp.wallet.enums.WalletStatus;
import com.superapp.wallet.gateway.PayoutGatewayClient;
import com.superapp.wallet.repository.MerchantBankAccountRepository;
import com.superapp.wallet.repository.MerchantPayoutRequestRepository;
import com.superapp.wallet.repository.MerchantWalletLedgerRepository;
import com.superapp.wallet.repository.MerchantWalletRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MerchantPayoutServiceImpl implements MerchantPayoutService {

    private static final Logger log = LoggerFactory.getLogger(MerchantPayoutServiceImpl.class);

    private final MerchantWalletRepository walletRepository;
    private final MerchantWalletLedgerRepository ledgerRepository;
    private final MerchantPayoutRequestRepository payoutRequestRepository;
    private final MerchantBankAccountRepository bankAccountRepository;
    private final MerchantRepository merchantRepository;
    private final PayoutGatewayClient payoutGatewayClient;
    private final AuditService auditService;

    public MerchantPayoutServiceImpl(
            MerchantWalletRepository walletRepository,
            MerchantWalletLedgerRepository ledgerRepository,
            MerchantPayoutRequestRepository payoutRequestRepository,
            MerchantBankAccountRepository bankAccountRepository,
            MerchantRepository merchantRepository,
            PayoutGatewayClient payoutGatewayClient,
            AuditService auditService) {
        this.walletRepository = walletRepository;
        this.ledgerRepository = ledgerRepository;
        this.payoutRequestRepository = payoutRequestRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.merchantRepository = merchantRepository;
        this.payoutGatewayClient = payoutGatewayClient;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public PayoutRequestResponse requestPayout(UUID merchantId, UUID userId, CreatePayoutRequest request) {
        // 1. Idempotency Check: if request with idempotencyKey already exists, return cached request response
        Optional<MerchantPayoutRequest> existingIdempotent = payoutRequestRepository.findByIdempotencyKey(request.idempotencyKey());
        if (existingIdempotent.isPresent()) {
            log.info("Idempotent payout request detected key={}. Returning cached payout.", request.idempotencyKey());
            return mapToResponse(existingIdempotent.get());
        }

        // 2. Lock Merchant Wallet with PESSIMISTIC_WRITE to prevent double-spend
        MerchantWallet wallet = walletRepository.findByMerchantIdForUpdate(merchantId)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant wallet not found", ApiError.RESOURCE_NOT_FOUND));

        if (wallet.getStatus() != WalletStatus.ACTIVE) {
            throw new AppException("Wallet is not active for payouts", ApiError.MUTATION_DENIED, 400);
        }

        BigDecimal requestedAmount = request.amount();
        if (wallet.getAvailableBalance().compareTo(requestedAmount) < 0) {
            throw new AppException("Insufficient available balance for withdrawal", ApiError.MUTATION_DENIED, 400);
        }

        // 3. Verify Bank Account
        MerchantBankAccount bankAccount = bankAccountRepository.findById(request.bankAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Target bank account not found", ApiError.RESOURCE_NOT_FOUND));

        if (!bankAccount.getMerchantId().equals(merchantId)) {
            throw new AppException("Bank account does not belong to merchant", ApiError.ACCESS_DENIED, 403);
        }

        // 4. Calculate Payout Fees (₹5 flat payout fee)
        BigDecimal payoutFee = new BigDecimal("5.00");
        BigDecimal netPayout = requestedAmount.subtract(payoutFee);

        // 5. Deduct balance from Wallet & Record HOLD / PENDING DEBIT in Double-Entry Ledger
        BigDecimal newAvailable = wallet.getAvailableBalance().subtract(requestedAmount);
        BigDecimal newPending = wallet.getPendingBalance().add(requestedAmount);
        wallet.setAvailableBalance(newAvailable);
        wallet.setPendingBalance(newPending);
        walletRepository.save(wallet);

        MerchantPayoutRequest payout = new MerchantPayoutRequest();
        payout.setMerchantId(merchantId);
        payout.setWalletId(wallet.getId());
        payout.setBankAccountId(bankAccount.getId());
        payout.setAmount(requestedAmount);
        payout.setPayoutFee(payoutFee);
        payout.setNetPayout(netPayout);
        payout.setCurrency("INR");
        payout.setMode(request.mode() != null ? request.mode() : PayoutMode.IMPS);
        payout.setStatus(PayoutStatus.PROCESSING);
        payout.setProvider(PayoutProvider.RAZORPAYX);
        payout.setIdempotencyKey(request.idempotencyKey());
        payout.setRequestedBy(userId);

        MerchantPayoutRequest savedPayout = payoutRequestRepository.save(payout);

        // Immutable Ledger HOLD record
        MerchantWalletLedger ledger = new MerchantWalletLedger();
        ledger.setWalletId(wallet.getId());
        ledger.setPayoutId(savedPayout.getId());
        ledger.setEntryType(LedgerEntryType.HOLD);
        ledger.setAmount(requestedAmount);
        ledger.setFeeDeducted(payoutFee);
        ledger.setNetAmount(netPayout);
        ledger.setRunningBalance(newAvailable);
        ledger.setDescription("Bank Payout Request HOLD - " + bankAccount.getBankName() + " (A/C **" + bankAccount.getAccountNumberLast4() + ")");
        ledger.setSourceReference("PAYOUT_HOLD_" + savedPayout.getId().toString().substring(0, 8));
        ledgerRepository.save(ledger);

        // 6. Dispatch Payout via 3rd Party Gateway Client (RazorpayX / Cashfree)
        PayoutGatewayClient.PayoutDispatchResult dispatch = payoutGatewayClient.dispatchPayout(savedPayout, bankAccount);

        if (dispatch.success()) {
            savedPayout.setProviderPayoutId(dispatch.providerPayoutId());
            savedPayout.setBankUtr(dispatch.utr());
            savedPayout.setStatus(PayoutStatus.PROCESSING);
        } else {
            savedPayout.setStatus(PayoutStatus.FAILED);
            savedPayout.setFailureReason(dispatch.errorMessage());
        }

        MerchantPayoutRequest updatedPayout = payoutRequestRepository.save(savedPayout);

        if (auditService != null) {
            auditService.record(
                    AuditEventType.MERCHANT_PAYOUT_REQUESTED,
                    userId,
                    null,
                    null,
                    null,
                    "Requested bank payout ₹" + requestedAmount + " to " + bankAccount.getBankName()
            );
        }

        return mapToResponse(updatedPayout);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PayoutRequestResponse> getMerchantPayouts(UUID merchantId, Pageable pageable) {
        return payoutRequestRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PayoutRequestResponse> getAllPayoutsForAdmin(PayoutStatus status, Pageable pageable) {
        if (status != null) {
            return payoutRequestRepository.findByMerchantIdOrderByCreatedAtDesc(null, pageable).map(this::mapToResponse);
        }
        return payoutRequestRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PlatformSettlementOverviewResponse getPlatformSettlementOverview() {
        List<MerchantWallet> wallets = walletRepository.findAll();
        List<MerchantPayoutRequest> payouts = payoutRequestRepository.findAll();

        BigDecimal gmv = wallets.stream().map(MerchantWallet::getLifetimeVolume).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal escrow = wallets.stream().map(MerchantWallet::getAvailableBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pendingVol = payouts.stream().filter(p -> p.getStatus() == PayoutStatus.PROCESSING || p.getStatus() == PayoutStatus.INITIATED).map(MerchantPayoutRequest::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingCount = payouts.stream().filter(p -> p.getStatus() == PayoutStatus.PROCESSING || p.getStatus() == PayoutStatus.INITIATED).count();
        long failedCount = payouts.stream().filter(p -> p.getStatus() == PayoutStatus.FAILED || p.getStatus() == PayoutStatus.HELD).count();

        return new PlatformSettlementOverviewResponse(
                gmv,
                escrow,
                gmv.multiply(new BigDecimal("0.025")), // 2.5% platform commission
                (long) wallets.size(),
                pendingCount,
                pendingVol,
                failedCount
        );
    }

    @Override
    @Transactional
    public void processPayoutWebhook(WebhookPayloadDto webhook, String rawPayload, String signatureHeader, String providerStr) {
        boolean verified = payoutGatewayClient.verifyWebhookSignature(rawPayload, signatureHeader, providerStr);
        if (!verified) {
            log.error("Rejecting unverified payout webhook signature for provider={}", providerStr);
            throw new AppException("Invalid HMAC-SHA256 signature", ApiError.ACCESS_DENIED, 401);
        }

        if (webhook.providerPayoutId() == null) {
            log.warn("Payout webhook missing providerPayoutId");
            return;
        }

        Optional<MerchantPayoutRequest> optPayout = payoutRequestRepository.findByProviderPayoutId(webhook.providerPayoutId());
        if (optPayout.isEmpty()) {
            log.warn("Payout webhook received for unknown providerPayoutId={}", webhook.providerPayoutId());
            return;
        }

        MerchantPayoutRequest payout = optPayout.get();
        if (payout.getStatus() == PayoutStatus.SUCCESS || payout.getStatus() == PayoutStatus.REVERSED) {
            log.info("Payout id={} is already in terminal state {}", payout.getId(), payout.getStatus());
            return;
        }

        MerchantWallet wallet = walletRepository.findByMerchantIdForUpdate(payout.getMerchantId())
                .orElseThrow(() -> new ResourceNotFoundException("Merchant wallet not found", ApiError.RESOURCE_NOT_FOUND));

        if ("SUCCESS".equalsIgnoreCase(webhook.status()) || "PROCESSED".equalsIgnoreCase(webhook.status())) {
            payout.setStatus(PayoutStatus.SUCCESS);
            payout.setBankUtr(webhook.utr() != null ? webhook.utr() : payout.getBankUtr());
            payout.setProcessedAt(Instant.now());
            payoutRequestRepository.save(payout);

            // Deduct pending balance & add to total withdrawn
            wallet.setPendingBalance(wallet.getPendingBalance().subtract(payout.getAmount()));
            wallet.setTotalWithdrawn(wallet.getTotalWithdrawn().add(payout.getAmount()));
            walletRepository.save(wallet);

            // Immutable Ledger DEBIT
            MerchantWalletLedger ledger = new MerchantWalletLedger();
            ledger.setWalletId(wallet.getId());
            ledger.setPayoutId(payout.getId());
            ledger.setEntryType(LedgerEntryType.DEBIT);
            ledger.setAmount(payout.getAmount());
            ledger.setFeeDeducted(payout.getPayoutFee());
            ledger.setNetAmount(payout.getNetPayout());
            ledger.setRunningBalance(wallet.getAvailableBalance());
            ledger.setDescription("Bank Payout Settled - UTR: " + payout.getBankUtr());
            ledger.setSourceReference("PAYOUT_SUCCESS_" + payout.getId().toString().substring(0, 8));
            ledgerRepository.save(ledger);

            log.info("Bank payout id={} SETTLED successfully. UTR={}", payout.getId(), payout.getBankUtr());
        } else if ("FAILED".equalsIgnoreCase(webhook.status()) || "REVERSED".equalsIgnoreCase(webhook.status())) {
            payout.setStatus(PayoutStatus.FAILED);
            payout.setFailureReason(webhook.failureReason() != null ? webhook.failureReason() : "Bank transfer failed");
            payoutRequestRepository.save(payout);

            // Revert wallet balances: add back to available, remove from pending
            wallet.setPendingBalance(wallet.getPendingBalance().subtract(payout.getAmount()));
            wallet.setAvailableBalance(wallet.getAvailableBalance().add(payout.getAmount()));
            walletRepository.save(wallet);

            // Immutable Ledger REVERSAL
            MerchantWalletLedger ledger = new MerchantWalletLedger();
            ledger.setWalletId(wallet.getId());
            ledger.setPayoutId(payout.getId());
            ledger.setEntryType(LedgerEntryType.REVERSAL);
            ledger.setAmount(payout.getAmount());
            ledger.setFeeDeducted(BigDecimal.ZERO);
            ledger.setNetAmount(payout.getAmount());
            ledger.setRunningBalance(wallet.getAvailableBalance());
            ledger.setDescription("Payout Failed & Balance Reverted - " + payout.getFailureReason());
            ledger.setSourceReference("PAYOUT_REVERSAL_" + payout.getId().toString().substring(0, 8));
            ledgerRepository.save(ledger);

            log.info("Bank payout id={} FAILED. Balance reverted to available.", payout.getId());
        }
    }

    @Override
    @Transactional
    public PayoutRequestResponse adminHoldPayout(UUID payoutId, String reason, UUID adminUserId) {
        MerchantPayoutRequest payout = payoutRequestRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout request not found", ApiError.RESOURCE_NOT_FOUND));

        payout.setStatus(PayoutStatus.HELD);
        payout.setFailureReason(reason != null ? reason : "Fraud Prevention Hold by Super Admin");
        MerchantPayoutRequest saved = payoutRequestRepository.save(payout);

        log.info("Admin {} placed HOLD on payout id={}", adminUserId, payoutId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public PayoutRequestResponse adminReleasePayout(UUID payoutId, UUID adminUserId) {
        MerchantPayoutRequest payout = payoutRequestRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout request not found", ApiError.RESOURCE_NOT_FOUND));

        payout.setStatus(PayoutStatus.PROCESSING);
        payout.setFailureReason(null);
        MerchantPayoutRequest saved = payoutRequestRepository.save(payout);

        log.info("Admin {} RELEASED hold on payout id={}", adminUserId, payoutId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public PayoutRequestResponse adminRetryPayout(UUID payoutId, UUID adminUserId) {
        MerchantPayoutRequest payout = payoutRequestRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout request not found", ApiError.RESOURCE_NOT_FOUND));

        payout.setStatus(PayoutStatus.PROCESSING);
        payout.setBankUtr("RETRY_UTR_" + System.currentTimeMillis() / 1000);
        MerchantPayoutRequest saved = payoutRequestRepository.save(payout);

        log.info("Admin {} RETRIED payout id={}", adminUserId, payoutId);
        return mapToResponse(saved);
    }

    private PayoutRequestResponse mapToResponse(MerchantPayoutRequest p) {
        String mName = merchantRepository.findById(p.getMerchantId()).map(Merchant::getBusinessName).orElse("Merchant Brand");
        MerchantBankAccount bank = bankAccountRepository.findById(p.getBankAccountId()).orElse(null);

        return new PayoutRequestResponse(
                p.getId(),
                p.getMerchantId(),
                mName,
                p.getWalletId(),
                p.getBankAccountId(),
                bank != null ? bank.getBankName() : "Bank Account",
                bank != null ? bank.getAccountNumberLast4() : "0000",
                bank != null ? bank.getAccountHolderName() : "Account Holder",
                p.getAmount(),
                p.getPayoutFee(),
                p.getNetPayout(),
                p.getCurrency(),
                p.getMode(),
                p.getStatus(),
                p.getProvider(),
                p.getProviderPayoutId(),
                p.getBankUtr(),
                p.getIdempotencyKey(),
                p.getFailureReason(),
                p.getRequestedBy(),
                p.getProcessedAt(),
                p.getCreatedAt()
        );
    }
}
