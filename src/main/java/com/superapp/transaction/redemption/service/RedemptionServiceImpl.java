package com.superapp.transaction.redemption.service;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferType;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.transaction.reward.service.RewardService;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.redemption.dto.CreateRedemptionRequest;
import com.superapp.transaction.redemption.dto.RedemptionHistoryResponse;
import com.superapp.transaction.redemption.dto.RedemptionResponse;
import com.superapp.transaction.redemption.entity.Redemption;
import com.superapp.transaction.redemption.enums.RedemptionStatus;
import com.superapp.transaction.redemption.mapper.RedemptionMapper;
import com.superapp.transaction.redemption.repository.RedemptionRepository;
import com.superapp.transaction.redemption.validation.RedemptionValidator;
import com.superapp.transaction.redemption.validation.RedemptionValidator.ValidatedRedemption;
import com.superapp.transaction.transaction.entity.Transaction;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.superapp.transaction.notification.service.NotificationService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RedemptionServiceImpl implements RedemptionService {

    private static final Logger log = LoggerFactory.getLogger(RedemptionServiceImpl.class);

    private final RedemptionRepository redemptionRepository;
    private final RedemptionValidator redemptionValidator;
    private final RedemptionMapper redemptionMapper;
    private final OfferRepository offerRepository;
    private final StoreRepository storeRepository;
    private final MerchantRepository merchantRepository;
    private final AuditService auditService;
    private final RewardService rewardService;
    private final NotificationService notificationService;
    private final TransactionRepository transactionRepository;

    @Autowired
    public RedemptionServiceImpl(
            RedemptionRepository redemptionRepository,
            RedemptionValidator redemptionValidator,
            RedemptionMapper redemptionMapper,
            OfferRepository offerRepository,
            StoreRepository storeRepository,
            MerchantRepository merchantRepository,
            AuditService auditService,
            RewardService rewardService,
            @Autowired(required = false) NotificationService notificationService,
            @Autowired(required = false) TransactionRepository transactionRepository) {
        this.redemptionRepository = redemptionRepository;
        this.redemptionValidator = redemptionValidator;
        this.redemptionMapper = redemptionMapper;
        this.offerRepository = offerRepository;
        this.storeRepository = storeRepository;
        this.merchantRepository = merchantRepository;
        this.auditService = auditService;
        this.rewardService = rewardService;
        this.notificationService = notificationService;
        this.transactionRepository = transactionRepository;
    }

    public RedemptionServiceImpl(
            RedemptionRepository redemptionRepository,
            RedemptionValidator redemptionValidator,
            RedemptionMapper redemptionMapper,
            OfferRepository offerRepository,
            StoreRepository storeRepository,
            MerchantRepository merchantRepository,
            AuditService auditService,
            RewardService rewardService,
            NotificationService notificationService) {
        this(redemptionRepository, redemptionValidator, redemptionMapper, offerRepository,
                storeRepository, merchantRepository, auditService, rewardService, notificationService, null);
    }

    public RedemptionServiceImpl(
            RedemptionRepository redemptionRepository,
            RedemptionValidator redemptionValidator,
            RedemptionMapper redemptionMapper,
            OfferRepository offerRepository,
            StoreRepository storeRepository,
            MerchantRepository merchantRepository,
            AuditService auditService,
            RewardService rewardService) {
        this(redemptionRepository, redemptionValidator, redemptionMapper, offerRepository,
                storeRepository, merchantRepository, auditService, rewardService, null, null);
    }

    @Override
    @Transactional
    public RedemptionResponse redeemOffer(UUID customerId, CreateRedemptionRequest request, String idempotencyKey, String requestId) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new AppException("Idempotency-Key header is required", ApiError.VALIDATION_FAILED, 400);
        }

        // 1. Check Idempotency by customerId + key
        Optional<Redemption> existingByKey = redemptionRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey);
        if (existingByKey.isPresent()) {
            Redemption existing = existingByKey.get();
            if (existing.getPaymentId().equals(request.paymentId()) && existing.getOfferId().equals(request.offerId())) {
                log.info("Idempotent replay for redemptionId={} customerId={}", existing.getId(), customerId);
                return redemptionMapper.toResponse(existing);
            } else {
                throw new AppException("Idempotency key has already been used for a different request", ApiError.IDEMPOTENCY_CONFLICT, 409);
            }
        }

        // 2. Comprehensive validation (Payment, Store, Merchant, Offer validity & limits)
        ValidatedRedemption validated = redemptionValidator.validateRedemption(
                customerId, request.paymentId(), request.offerId());

        Payment payment = validated.payment();
        Transaction transaction = validated.transaction();
        Offer offer = validated.offer();
        Store store = validated.store();
        Merchant merchant = validated.merchant();

        // 3. Financial calculations
        BigDecimal redeemedAmount = payment.getGrossAmount() != null ? payment.getGrossAmount() : payment.getAmount();
        BigDecimal discountAmount;
        BigDecimal rewardAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        if (offer.getType() == OfferType.CASHBACK) {
            discountAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            if (payment.getDiscountAmount() != null && payment.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                rewardAmount = payment.getDiscountAmount();
            } else {
                rewardAmount = redeemedAmount.multiply(offer.getValue())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                if (offer.getMaxDiscountAmount() != null && rewardAmount.compareTo(offer.getMaxDiscountAmount()) > 0) {
                    rewardAmount = offer.getMaxDiscountAmount();
                }
            }
        } else {
            discountAmount = payment.getDiscountAmount() != null ? payment.getDiscountAmount() : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        // 4. Create and persist Redemption
        Redemption redemption = new Redemption();
        redemption.setCustomerId(customerId);
        redemption.setMerchantId(merchant.getId());
        redemption.setStoreId(store.getId());
        redemption.setOfferId(offer.getId());
        redemption.setPaymentId(payment.getId());
        if (transaction != null) {
            redemption.setTransactionId(transaction.getId());
        }
        redemption.setRedeemedAmount(redeemedAmount);
        redemption.setDiscountAmount(discountAmount);
        redemption.setRewardAmount(rewardAmount);
        redemption.setStatus(RedemptionStatus.SUCCESS);
        redemption.setIdempotencyKey(idempotencyKey);
        redemption.setRedeemedAt(Instant.now());

        Redemption saved;
        try {
            saved = redemptionRepository.save(redemption);
            if (transaction != null) {
                transaction.setRedemptionId(saved.getId());
                if (transactionRepository != null) {
                    transactionRepository.save(transaction);
                }
            }
            // Atomically increment currentUsageCount on offer
            offer.setCurrentUsageCount(offer.getCurrentUsageCount() + 1);
            offerRepository.save(offer);
        } catch (DataIntegrityViolationException e) {
            log.warn("Database constraint violation during redemption: {}", e.getMessage());
            Optional<Redemption> duplicate = redemptionRepository.findByCustomerIdAndPaymentIdAndOfferId(
                    customerId, request.paymentId(), request.offerId());
            if (duplicate.isPresent()) {
                auditService.record(AuditEventType.DUPLICATE_REDEMPTION_ATTEMPT, customerId, null, null, requestId,
                        "Duplicate redemption attempt for payment " + request.paymentId());
                throw new AppException("Offer has already been redeemed", ApiError.OFFER_ALREADY_REDEEMED, 409);
            }
            throw new AppException("Idempotency key has already been used for a different request", ApiError.IDEMPOTENCY_CONFLICT, 409);
        }

        // 5. Audit Logging
        Map<String, Object> auditDetails = new HashMap<>();
        auditDetails.put("redemptionId", saved.getId().toString());
        auditDetails.put("paymentId", payment.getId().toString());
        if (transaction != null) {
            auditDetails.put("transactionId", transaction.getId().toString());
        }
        auditDetails.put("customerId", customerId.toString());
        auditDetails.put("offerId", offer.getId().toString());
        auditDetails.put("requestId", requestId);
        auditDetails.put("status", saved.getStatus().name());
        auditService.record(AuditEventType.REDEMPTION_SUCCESS, customerId, null, null, requestId, auditDetails.toString());

        // 6. Rewards Integration Point (Idempotent reward credit)
        if (rewardAmount.compareTo(BigDecimal.ZERO) > 0) {
            try {
                if (rewardService != null) {
                    rewardService.creditRedemptionReward(
                            customerId,
                            saved.getId(),
                            transaction != null ? transaction.getId() : null,
                            rewardAmount,
                            "Reward for redemption " + saved.getId()
                    );
                }
            } catch (Exception ex) {
                log.warn("Reward credit failed for redemptionId={}: {}", saved.getId(), ex.getMessage());
            }
        }

        // 7. Notification Integration Point
        if (notificationService != null) {
            try {
                notificationService.createRedemptionNotification(saved);
            } catch (Exception ex) {
                log.warn("Notification dispatch failed for redemptionId={}: {}", saved.getId(), ex.getMessage());
            }
        }

        return redemptionMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public RedemptionResponse getRedemptionById(UUID redemptionId, UUID currentUserId, boolean isAdmin) {
        Redemption redemption = redemptionRepository.findById(redemptionId)
                .orElseThrow(() -> new AppException("Redemption not found", ApiError.REDEMPTION_NOT_FOUND, 404));

        if (!isAdmin && !redemption.getCustomerId().equals(currentUserId)) {
            throw new AppException("You are not authorized to view this redemption", ApiError.REDEMPTION_ACCESS_DENIED, 403);
        }

        return redemptionMapper.toResponse(redemption);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RedemptionHistoryResponse> getCustomerRedemptions(
            UUID customerId, String status, Instant fromDate, Instant toDate, Pageable pageable) {

        Specification<Redemption> spec = (root, query, cb) -> cb.equal(root.get("customerId"), customerId);

        if (status != null && !status.isBlank()) {
            try {
                RedemptionStatus redemptionStatus = RedemptionStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), redemptionStatus));
            } catch (IllegalArgumentException ignored) {}
        }
        if (fromDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
        }
        if (toDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
        }

        Page<Redemption> page = redemptionRepository.findAll(spec, pageable);
        return mapToHistoryResponsePage(page);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RedemptionHistoryResponse> getMerchantRedemptions(
            UUID merchantOwnerUserId, UUID storeId, UUID offerId, String status, Instant fromDate, Instant toDate, Pageable pageable) {

        Merchant merchant = merchantRepository.findByOwnerUserId(merchantOwnerUserId)
                .orElseThrow(() -> new AppException("Merchant not found for current user", ApiError.MERCHANT_NOT_FOUND, 404));

        Specification<Redemption> spec = (root, query, cb) -> cb.equal(root.get("merchantId"), merchant.getId());

        if (storeId != null) {
            Store store = storeRepository.findById(storeId)
                    .orElseThrow(() -> new AppException("Store not found", ApiError.STORE_NOT_FOUND, 404));
            if (!store.getMerchantId().equals(merchant.getId())) {
                throw new AppException("Store does not belong to your merchant account", ApiError.STORE_ACCESS_DENIED, 403);
            }
            spec = spec.and((root, query, cb) -> cb.equal(root.get("storeId"), storeId));
        }

        if (offerId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("offerId"), offerId));
        }
        if (status != null && !status.isBlank()) {
            try {
                RedemptionStatus redemptionStatus = RedemptionStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), redemptionStatus));
            } catch (IllegalArgumentException ignored) {}
        }
        if (fromDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
        }
        if (toDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
        }

        Page<Redemption> page = redemptionRepository.findAll(spec, pageable);
        return mapToHistoryResponsePage(page);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RedemptionHistoryResponse> getAdminRedemptions(
            UUID customerId, UUID merchantId, UUID storeId, UUID offerId, String status, Instant fromDate, Instant toDate, Pageable pageable) {

        Specification<Redemption> spec = (root, query, cb) -> cb.conjunction();

        if (customerId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("customerId"), customerId));
        }
        if (merchantId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("merchantId"), merchantId));
        }
        if (storeId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("storeId"), storeId));
        }
        if (offerId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("offerId"), offerId));
        }
        if (status != null && !status.isBlank()) {
            try {
                RedemptionStatus redemptionStatus = RedemptionStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), redemptionStatus));
            } catch (IllegalArgumentException ignored) {}
        }
        if (fromDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
        }
        if (toDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
        }

        Page<Redemption> page = redemptionRepository.findAll(spec, pageable);
        return mapToHistoryResponsePage(page);
    }

    private Page<RedemptionHistoryResponse> mapToHistoryResponsePage(Page<Redemption> page) {
        List<Redemption> items = page.getContent();
        if (items.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), page.getPageable(), page.getTotalElements());
        }

        Set<UUID> offerIds = items.stream().map(Redemption::getOfferId).collect(Collectors.toSet());
        Set<UUID> storeIds = items.stream().map(Redemption::getStoreId).collect(Collectors.toSet());

        Map<UUID, String> offerTitles = offerRepository.findAllById(offerIds).stream()
                .collect(Collectors.toMap(Offer::getId, Offer::getTitle));

        Map<UUID, String> storeNames = storeRepository.findAllById(storeIds).stream()
                .collect(Collectors.toMap(Store::getId, Store::getStoreName));

        List<RedemptionHistoryResponse> responseList = items.stream()
                .map(r -> redemptionMapper.toHistoryResponse(
                        r,
                        offerTitles.getOrDefault(r.getOfferId(), "Offer"),
                        storeNames.getOrDefault(r.getStoreId(), "Store")
                ))
                .toList();

        return new PageImpl<>(responseList, page.getPageable(), page.getTotalElements());
    }
}
