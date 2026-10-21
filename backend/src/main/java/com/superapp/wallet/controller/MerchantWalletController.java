package com.superapp.wallet.controller;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.common.response.ApiResponse;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.wallet.dto.*;
import com.superapp.wallet.service.MerchantPayoutService;
import com.superapp.wallet.service.MerchantWalletService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/merchant/wallet")
@PreAuthorize("hasAnyRole('ADMIN', 'MERCHANT', 'STORE_MANAGER')")
public class MerchantWalletController {

    private final MerchantWalletService walletService;
    private final MerchantPayoutService payoutService;
    private final MerchantRepository merchantRepository;

    public MerchantWalletController(MerchantWalletService walletService,
                                    MerchantPayoutService payoutService,
                                    MerchantRepository merchantRepository) {
        this.walletService = walletService;
        this.payoutService = payoutService;
        this.merchantRepository = merchantRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<WalletSummaryResponse>> getWalletSummary(
            @RequestParam(name = "merchantId", required = false) UUID merchantId,
            Principal principal) {
        UUID effectiveMerchantId = extractEffectiveMerchantId(merchantId, principal);
        WalletSummaryResponse summary = walletService.getWalletSummaryByMerchantId(effectiveMerchantId);
        return ResponseEntity.ok(ApiResponse.success("Wallet summary retrieved successfully", summary));
    }

    @GetMapping("/ledger")
    public ResponseEntity<ApiResponse<Page<WalletLedgerResponse>>> getWalletLedger(
            @RequestParam(name = "merchantId", required = false) UUID merchantId,
            @RequestParam(name = "storeId", required = false) UUID storeId,
            @PageableDefault(size = 20) Pageable pageable,
            Principal principal) {
        UUID effectiveMerchantId = extractEffectiveMerchantId(merchantId, principal);
        Page<WalletLedgerResponse> page = walletService.getWalletLedger(effectiveMerchantId, storeId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Wallet ledger retrieved successfully", page));
    }

    @PostMapping("/payout")
    public ResponseEntity<ApiResponse<PayoutRequestResponse>> requestPayout(
            @RequestParam(name = "merchantId", required = false) UUID merchantId,
            @Valid @RequestBody CreatePayoutRequest request,
            Principal principal) {
        UUID effectiveMerchantId = extractEffectiveMerchantId(merchantId, principal);
        UUID userId = extractUserId(principal);
        PayoutRequestResponse response = payoutService.requestPayout(effectiveMerchantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bank payout requested successfully", response));
    }

    @GetMapping("/payouts")
    public ResponseEntity<ApiResponse<Page<PayoutRequestResponse>>> getMerchantPayouts(
            @RequestParam(name = "merchantId", required = false) UUID merchantId,
            @PageableDefault(size = 20) Pageable pageable,
            Principal principal) {
        UUID effectiveMerchantId = extractEffectiveMerchantId(merchantId, principal);
        Page<PayoutRequestResponse> page = payoutService.getMerchantPayouts(effectiveMerchantId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Payout history retrieved successfully", page));
    }

    @PostMapping("/bank-accounts")
    public ResponseEntity<ApiResponse<BankAccountResponse>> addBankAccount(
            @RequestParam(name = "merchantId", required = false) UUID merchantId,
            @Valid @RequestBody CreateBankAccountRequest request,
            Principal principal) {
        UUID effectiveMerchantId = extractEffectiveMerchantId(merchantId, principal);
        BankAccountResponse response = walletService.addBankAccount(effectiveMerchantId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bank account added and verified successfully", response));
    }

    @GetMapping("/bank-accounts")
    public ResponseEntity<ApiResponse<List<BankAccountResponse>>> getBankAccounts(
            @RequestParam(name = "merchantId", required = false) UUID merchantId,
            Principal principal) {
        UUID effectiveMerchantId = extractEffectiveMerchantId(merchantId, principal);
        List<BankAccountResponse> list = walletService.getBankAccounts(effectiveMerchantId);
        return ResponseEntity.ok(ApiResponse.success("Bank accounts retrieved successfully", list));
    }

    private UUID extractEffectiveMerchantId(UUID queryMerchantId, Principal principal) {
        if (principal == null) {
            throw new AppException("User is not authenticated", ApiError.UNAUTHORIZED, 401);
        }

        UUID userId = extractUserId(principal);

        boolean isAdmin = false;
        if (principal instanceof Authentication auth) {
            isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        }

        if (isAdmin) {
            if (queryMerchantId != null) {
                return queryMerchantId;
            }
            return merchantRepository.findByOwnerUserId(userId)
                    .map(Merchant::getId)
                    .orElseThrow(() -> new AppException("merchantId query parameter is required for administrator requests", ApiError.VALIDATION_ERROR, 400));
        }

        Merchant merchant = merchantRepository.findByOwnerUserId(userId)
                .orElseThrow(() -> new AppException("No merchant profile found associated with current user", ApiError.MERCHANT_NOT_FOUND, 404));

        if (queryMerchantId != null && !queryMerchantId.equals(merchant.getId())) {
            throw new AppException("Access denied: You do not have permission to manage this merchant's wallet", ApiError.ACCESS_DENIED, 403);
        }

        return merchant.getId();
    }

    private UUID extractUserId(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new AppException("User is not authenticated", ApiError.UNAUTHORIZED, 401);
        }
        try {
            return UUID.fromString(principal.getName());
        } catch (IllegalArgumentException ex) {
            throw new AppException("Invalid user identifier in token", ApiError.UNAUTHORIZED, 401);
        }
    }
}
