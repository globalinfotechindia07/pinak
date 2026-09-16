package com.superapp.transaction.reward.service;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.transaction.reward.dto.AdminRewardAdjustmentRequest;
import com.superapp.transaction.reward.dto.AdminRewardAdjustmentResponse;
import com.superapp.transaction.reward.dto.RewardBalanceResponse;
import com.superapp.transaction.reward.dto.RewardLedgerItemResponse;
import com.superapp.transaction.reward.entity.RewardAccount;
import com.superapp.transaction.reward.entity.RewardLedgerEntry;
import com.superapp.transaction.reward.enums.RewardLedgerStatus;
import com.superapp.transaction.reward.enums.RewardLedgerType;
import com.superapp.transaction.reward.mapper.RewardMapper;
import com.superapp.transaction.reward.repository.RewardAccountRepository;
import com.superapp.transaction.reward.repository.RewardLedgerRepository;
import com.superapp.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.superapp.transaction.notification.service.NotificationService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
public class RewardServiceImpl implements RewardService {

    private static final Logger log = LoggerFactory.getLogger(RewardServiceImpl.class);

    private final RewardAccountRepository rewardAccountRepository;
    private final RewardLedgerRepository rewardLedgerRepository;
    private final RewardCacheService rewardCacheService;
    private final RewardMapper rewardMapper;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Autowired
    public RewardServiceImpl(
            RewardAccountRepository rewardAccountRepository,
            RewardLedgerRepository rewardLedgerRepository,
            RewardCacheService rewardCacheService,
            RewardMapper rewardMapper,
            UserRepository userRepository,
            AuditService auditService,
            @Autowired(required = false) NotificationService notificationService) {
        this.rewardAccountRepository = rewardAccountRepository;
        this.rewardLedgerRepository = rewardLedgerRepository;
        this.rewardCacheService = rewardCacheService;
        this.rewardMapper = rewardMapper;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    public RewardServiceImpl(
            RewardAccountRepository rewardAccountRepository,
            RewardLedgerRepository rewardLedgerRepository,
            RewardCacheService rewardCacheService,
            RewardMapper rewardMapper,
            UserRepository userRepository,
            AuditService auditService) {
        this(rewardAccountRepository, rewardLedgerRepository, rewardCacheService, rewardMapper,
                userRepository, auditService, null);
    }

    @Override
    @Transactional
    public RewardAccount getOrCreateAccount(UUID customerId) {
        return rewardAccountRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    RewardAccount newAccount = new RewardAccount(customerId);
                    try {
                        return rewardAccountRepository.save(newAccount);
                    } catch (DataIntegrityViolationException e) {
                        return rewardAccountRepository.findByCustomerId(customerId).orElseThrow();
                    }
                });
    }

    @Override
    @Transactional(readOnly = true)
    public RewardBalanceResponse getRewardBalance(UUID customerId) {
        Optional<RewardBalanceResponse> cached = rewardCacheService.getAccount(customerId);
        if (cached.isPresent()) {
            return cached.get();
        }

        RewardAccount account = rewardAccountRepository.findByCustomerId(customerId)
                .orElseGet(() -> new RewardAccount(customerId));

        RewardBalanceResponse response = rewardMapper.toBalanceResponse(account);
        rewardCacheService.putAccount(customerId, response);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RewardLedgerItemResponse> getCustomerLedger(
            UUID customerId, String type, String status, Instant fromDate, Instant toDate, Pageable pageable) {

        Specification<RewardLedgerEntry> spec = (root, query, cb) -> cb.equal(root.get("customerId"), customerId);

        if (type != null && !type.isBlank()) {
            try {
                RewardLedgerType ledgerType = RewardLedgerType.valueOf(type.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), ledgerType));
            } catch (IllegalArgumentException ignored) {}
        }
        if (status != null && !status.isBlank()) {
            try {
                RewardLedgerStatus ledgerStatus = RewardLedgerStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), ledgerStatus));
            } catch (IllegalArgumentException ignored) {}
        }
        if (fromDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
        }
        if (toDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
        }

        return rewardLedgerRepository.findAll(spec, pageable)
                .map(rewardMapper::toLedgerItemResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public RewardLedgerItemResponse getLedgerEntryById(UUID entryId, UUID currentUserId, boolean isAdmin) {
        RewardLedgerEntry entry = rewardLedgerRepository.findById(entryId)
                .orElseThrow(() -> new AppException("Reward ledger entry not found", ApiError.REWARD_LEDGER_NOT_FOUND, 404));

        if (!isAdmin && !entry.getCustomerId().equals(currentUserId)) {
            throw new AppException("You are not authorized to view this reward entry", ApiError.REWARD_ACCESS_DENIED, 403);
        }

        return rewardMapper.toLedgerItemResponse(entry);
    }

    @Override
    @Transactional
    public RewardLedgerItemResponse creditRedemptionReward(
            UUID customerId, UUID redemptionId, UUID transactionId, BigDecimal amount, String description) {

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Reward amount must be greater than 0", ApiError.INVALID_REWARD_AMOUNT, 400);
        }

        // 1. Idempotency Check: check if already credited for this redemption
        if (redemptionId != null) {
            Optional<RewardLedgerEntry> existing = rewardLedgerRepository.findByRedemptionIdAndType(
                    redemptionId, RewardLedgerType.CREDIT);
            if (existing.isPresent()) {
                log.info("Idempotent replay: reward already credited for redemptionId={}", redemptionId);
                return rewardMapper.toLedgerItemResponse(existing.get());
            }
        }

        String referenceId = "REWARD-" + (redemptionId != null ? redemptionId.toString() : UUID.randomUUID().toString());
        Optional<RewardLedgerEntry> existingByRef = rewardLedgerRepository.findByReferenceIdAndType(
                referenceId, RewardLedgerType.CREDIT);
        if (existingByRef.isPresent()) {
            return rewardMapper.toLedgerItemResponse(existingByRef.get());
        }

        // 2. Fetch or create account with lock
        RewardAccount account = rewardAccountRepository.findByCustomerIdForUpdate(customerId)
                .orElseGet(() -> getOrCreateAccount(customerId));

        BigDecimal creditAmount = amount.setScale(2, RoundingMode.HALF_UP);

        // 3. Create immutable ledger entry
        RewardLedgerEntry entry = new RewardLedgerEntry();
        entry.setCustomerId(customerId);
        entry.setRewardAccountId(account.getId());
        entry.setTransactionId(transactionId);
        entry.setRedemptionId(redemptionId);
        entry.setType(RewardLedgerType.CREDIT);
        entry.setAmount(creditAmount);
        entry.setStatus(RewardLedgerStatus.POSTED);
        entry.setReferenceId(referenceId);
        entry.setDescription(description != null ? description : "Reward credited for offer redemption");
        entry.setCreatedAt(Instant.now());

        RewardLedgerEntry savedEntry;
        try {
            savedEntry = rewardLedgerRepository.save(entry);
            // 4. Update account balance
            account.setAvailableBalance(account.getAvailableBalance().add(creditAmount));
            account.setLifetimeEarned(account.getLifetimeEarned().add(creditAmount));
            rewardAccountRepository.save(account);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Duplicate reward credit race condition caught for redemptionId={}", redemptionId);
            if (redemptionId != null) {
                return rewardLedgerRepository.findByRedemptionIdAndType(redemptionId, RewardLedgerType.CREDIT)
                        .map(rewardMapper::toLedgerItemResponse)
                        .orElseThrow(() -> new AppException("Duplicate reward credit attempt", ApiError.REWARD_ALREADY_CREDITED, 409));
            }
            throw new AppException("Reward has already been credited", ApiError.REWARD_ALREADY_CREDITED, 409);
        }

        // 5. Invalidate Redis Cache
        rewardCacheService.evictAccount(customerId);

        // 6. Asynchronous Notification Integration Point
        if (notificationService != null) {
            try {
                notificationService.createRewardNotification(savedEntry);
            } catch (Exception ex) {
                log.warn("Failed to dispatch reward notification: {}", ex.getMessage());
            }
        }

        // 7. Audit Logging
        Map<String, Object> audit = new HashMap<>();
        audit.put("customerId", customerId.toString());
        audit.put("amount", creditAmount.toString());
        audit.put("redemptionId", redemptionId != null ? redemptionId.toString() : null);
        audit.put("ledgerEntryId", savedEntry.getId().toString());
        auditService.record(AuditEventType.REWARD_CREDITED, customerId, null, null, null, audit.toString());

        return rewardMapper.toLedgerItemResponse(savedEntry);
    }

    @Override
    @Transactional
    public RewardLedgerItemResponse reverseReward(
            UUID ledgerEntryId, String reason, String requestId, UUID adminUserId) {

        RewardLedgerEntry original = rewardLedgerRepository.findById(ledgerEntryId)
                .orElseThrow(() -> new AppException("Original reward entry not found", ApiError.REWARD_LEDGER_NOT_FOUND, 404));

        if (original.getStatus() == RewardLedgerStatus.REVERSED) {
            throw new AppException("Reward entry has already been reversed", ApiError.REWARD_ALREADY_REVERSED, 409);
        }

        String reversalRef = "REVERSAL-" + original.getId();
        Optional<RewardLedgerEntry> existingReversal = rewardLedgerRepository.findByReferenceIdAndType(
                reversalRef, RewardLedgerType.REVERSAL);
        if (existingReversal.isPresent()) {
            return rewardMapper.toLedgerItemResponse(existingReversal.get());
        }

        RewardAccount account = rewardAccountRepository.findByCustomerIdForUpdate(original.getCustomerId())
                .orElseThrow(() -> new AppException("Reward account not found", ApiError.REWARD_ACCOUNT_NOT_FOUND, 404));

        if (account.getAvailableBalance().compareTo(original.getAmount()) < 0) {
            throw new AppException("Insufficient reward balance for reversal", ApiError.INSUFFICIENT_REWARD_BALANCE, 409);
        }

        // Create compensating reversal ledger entry
        RewardLedgerEntry reversal = new RewardLedgerEntry();
        reversal.setCustomerId(original.getCustomerId());
        reversal.setRewardAccountId(account.getId());
        reversal.setTransactionId(original.getTransactionId());
        reversal.setRedemptionId(original.getRedemptionId());
        reversal.setType(RewardLedgerType.REVERSAL);
        reversal.setAmount(original.getAmount());
        reversal.setStatus(RewardLedgerStatus.POSTED);
        reversal.setReferenceId(reversalRef);
        reversal.setDescription("Reversal: " + (reason != null ? reason : "Compensating adjustment"));
        reversal.setCreatedAt(Instant.now());

        original.setStatus(RewardLedgerStatus.REVERSED);

        rewardLedgerRepository.save(original);
        RewardLedgerEntry savedReversal = rewardLedgerRepository.save(reversal);

        // Update balance
        account.setAvailableBalance(account.getAvailableBalance().subtract(original.getAmount()));
        account.setLifetimeRedeemed(account.getLifetimeRedeemed().add(original.getAmount()));
        rewardAccountRepository.save(account);

        // Invalidate cache
        rewardCacheService.evictAccount(original.getCustomerId());

        if (notificationService != null) {
            try {
                notificationService.createRewardNotification(savedReversal);
            } catch (Exception ex) {
                log.warn("Failed to dispatch reward reversal notification: {}", ex.getMessage());
            }
        }

        // Audit log
        Map<String, Object> audit = new HashMap<>();
        audit.put("adminUserId", adminUserId != null ? adminUserId.toString() : null);
        audit.put("originalEntryId", original.getId() != null ? original.getId().toString() : null);
        audit.put("reversalEntryId", savedReversal.getId() != null ? savedReversal.getId().toString() : null);
        audit.put("amount", original.getAmount().toString());
        audit.put("reason", reason);
        auditService.record(AuditEventType.REWARD_REVERSED, original.getCustomerId(), null, null, requestId, audit.toString());

        return rewardMapper.toLedgerItemResponse(savedReversal);
    }

    @Override
    @Transactional
    public AdminRewardAdjustmentResponse adjustReward(
            AdminRewardAdjustmentRequest request, String idempotencyKey, String requestId, UUID adminUserId) {

        if (!userRepository.existsById(request.customerId())) {
            throw new AppException("Customer not found", ApiError.USER_NOT_FOUND, 404);
        }

        if (request.reason() == null || request.reason().isBlank()) {
            throw new AppException("Reason is mandatory for reward adjustment", ApiError.VALIDATION_FAILED, 400);
        }

        String referenceId = "ADJUST-" + idempotencyKey;
        Optional<RewardLedgerEntry> existing = rewardLedgerRepository.findByReferenceIdAndType(
                referenceId, request.type());
        if (existing.isPresent()) {
            log.info("Idempotent replay for admin reward adjustment with key={}", idempotencyKey);
            return rewardMapper.toAdjustmentResponse(existing.get());
        }

        RewardAccount account = rewardAccountRepository.findByCustomerIdForUpdate(request.customerId())
                .orElseGet(() -> getOrCreateAccount(request.customerId()));

        BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);

        // Validate negative adjustment / debit
        if (request.type() == RewardLedgerType.DEBIT) {
            if (account.getAvailableBalance().compareTo(amount) < 0) {
                throw new AppException("Insufficient balance for debit adjustment", ApiError.INSUFFICIENT_REWARD_BALANCE, 409);
            }
        }

        RewardLedgerEntry entry = new RewardLedgerEntry();
        entry.setCustomerId(request.customerId());
        entry.setRewardAccountId(account.getId());
        entry.setType(request.type());
        entry.setAmount(amount);
        entry.setStatus(RewardLedgerStatus.POSTED);
        entry.setReferenceId(referenceId);
        entry.setDescription(request.reason());
        entry.setCreatedAt(Instant.now());

        RewardLedgerEntry savedEntry;
        try {
            savedEntry = rewardLedgerRepository.save(entry);
        } catch (DataIntegrityViolationException e) {
            return rewardLedgerRepository.findByReferenceIdAndType(referenceId, request.type())
                    .map(rewardMapper::toAdjustmentResponse)
                    .orElseThrow(() -> new AppException("Idempotency conflict for adjustment", ApiError.IDEMPOTENCY_CONFLICT, 409));
        }

        if (request.type() == RewardLedgerType.DEBIT) {
            account.setAvailableBalance(account.getAvailableBalance().subtract(amount));
            account.setLifetimeRedeemed(account.getLifetimeRedeemed().add(amount));
        } else {
            account.setAvailableBalance(account.getAvailableBalance().add(amount));
            account.setLifetimeEarned(account.getLifetimeEarned().add(amount));
        }
        rewardAccountRepository.save(account);

        // Evict cache
        rewardCacheService.evictAccount(request.customerId());

        // Audit log
        Map<String, Object> audit = new HashMap<>();
        audit.put("adminUserId", adminUserId != null ? adminUserId.toString() : null);
        audit.put("customerId", request.customerId().toString());
        audit.put("amount", amount.toString());
        audit.put("type", request.type().name());
        audit.put("reason", request.reason());
        audit.put("idempotencyKey", idempotencyKey);
        auditService.record(AuditEventType.REWARD_ADJUSTED, request.customerId(), null, null, requestId, audit.toString());

        return rewardMapper.toAdjustmentResponse(savedEntry);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RewardLedgerItemResponse> getAdminLedger(
            UUID customerId, String type, String status, Instant fromDate, Instant toDate, Pageable pageable) {

        Specification<RewardLedgerEntry> spec = (root, query, cb) -> cb.conjunction();

        if (customerId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("customerId"), customerId));
        }
        if (type != null && !type.isBlank()) {
            try {
                RewardLedgerType ledgerType = RewardLedgerType.valueOf(type.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), ledgerType));
            } catch (IllegalArgumentException ignored) {}
        }
        if (status != null && !status.isBlank()) {
            try {
                RewardLedgerStatus ledgerStatus = RewardLedgerStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), ledgerStatus));
            } catch (IllegalArgumentException ignored) {}
        }
        if (fromDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
        }
        if (toDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
        }

        return rewardLedgerRepository.findAll(spec, pageable)
                .map(rewardMapper::toLedgerItemResponse);
    }
}
