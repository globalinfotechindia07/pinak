package com.superapp.offer.service;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.dto.*;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.mapper.OfferMapper;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.offer.specification.OfferSpecification;
import com.superapp.offer.validation.OfferValidator;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.repository.StoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OfferServiceImpl implements OfferService {

    private static final Logger log = LoggerFactory.getLogger(OfferServiceImpl.class);

    private final OfferRepository offerRepository;
    private final MerchantRepository merchantRepository;
    private final StoreRepository storeRepository;
    private final OfferValidator offerValidator;
    private final OfferMapper offerMapper;
    private final AuditService auditService;
    private final com.superapp.common.audit.AuditLogRepository auditLogRepository;
    private final CacheManager cacheManager;

    public OfferServiceImpl(
            OfferRepository offerRepository,
            MerchantRepository merchantRepository,
            StoreRepository storeRepository,
            OfferValidator offerValidator,
            OfferMapper offerMapper,
            AuditService auditService,
            CacheManager cacheManager) {
        this(offerRepository, merchantRepository, storeRepository, offerValidator, offerMapper, auditService, null, cacheManager);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public OfferServiceImpl(
            OfferRepository offerRepository,
            MerchantRepository merchantRepository,
            StoreRepository storeRepository,
            OfferValidator offerValidator,
            OfferMapper offerMapper,
            AuditService auditService,
            com.superapp.common.audit.AuditLogRepository auditLogRepository,
            CacheManager cacheManager) {
        this.offerRepository = offerRepository;
        this.merchantRepository = merchantRepository;
        this.storeRepository = storeRepository;
        this.offerValidator = offerValidator;
        this.offerMapper = offerMapper;
        this.auditService = auditService;
        this.auditLogRepository = auditLogRepository;
        this.cacheManager = cacheManager;
    }

    // =========================================================================
    // Merchant Operations
    // =========================================================================

    @Override
    @Transactional
    public MerchantOfferResponse createMerchantOffer(CreateOfferRequest request, UUID currentUserId) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);
        offerValidator.validateCreateRequest(request);

        Store store = null;
        if (request.storeId() != null) {
            store = storeRepository.findById(request.storeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND));

            if (!store.getMerchantId().equals(merchant.getId())) {
                throw new AppException("You do not have permission to access this store", ApiError.OFFER_ACCESS_DENIED, 403);
            }

            if (store.getApprovalStatus() != ApprovalStatus.APPROVED || store.getStatus() != StoreStatus.ACTIVE) {
                throw new AppException("Store is not active or approved", ApiError.STORE_NOT_ELIGIBLE, 400);
            }
        }

        Offer offer = new Offer();
        offer.setMerchantId(merchant.getId());
        offer.setStoreId(request.storeId());
        offer.setCategoryId(merchant.getCategoryId());
        offer.setTitle(request.title().trim());
        offer.setDescription(request.description() != null ? request.description().trim() : null);
        offer.setType(request.offerType());
        offer.setValue(request.value());
        offer.setMinTransactionAmount(request.minTransactionAmount());
        offer.setMaxDiscountAmount(request.maxDiscountAmount());
        offer.setUsageLimit(request.usageLimit());
        offer.setPerCustomerLimit(request.perCustomerLimit());
        offer.setValidFrom(request.validFrom());
        offer.setValidTo(request.validTo());
        if (request.offerScope() != null) offer.setOfferScope(request.offerScope());
        if (request.originalMrp() != null) offer.setOriginalMrp(request.originalMrp());
        if (request.flashSellingPrice() != null) offer.setFlashSellingPrice(request.flashSellingPrice());
        if (request.isFlash() != null) offer.setIsFlash(request.isFlash());
        if (request.remainingQuantity() != null) offer.setRemainingQuantity(request.remainingQuantity());
        if (request.bonusCoins() != null) offer.setBonusCoins(request.bonusCoins());
        if (request.imageUrl() != null) offer.setImageUrl(request.imageUrl());
        if (request.badgeText() != null) offer.setBadgeText(request.badgeText());
        if (request.ctaText() != null) offer.setCtaText(request.ctaText());
        offer.setStatus(OfferStatus.CREATED);
        offer.setApprovalStatus(OfferApprovalStatus.DRAFT);
        offer.setCreatedBy(currentUserId.toString());
        offer.setUpdatedBy(currentUserId.toString());

        Offer saved = offerRepository.save(offer);
        log.info("Merchant {} created offer id={} for store={}", merchant.getId(), saved.getId(), saved.getStoreId());

        if (auditService != null) {
            auditService.record(
                    AuditEventType.OFFER_CREATED,
                    currentUserId,
                    null,
                    null,
                    MDC.get("requestId"),
                    "Created offer id=" + saved.getId() + " title='" + saved.getTitle() + "'"
            );
        }

        evictOfferCaches(saved);
        String storeName = store != null ? store.getStoreName() : null;
        return offerMapper.toMerchantResponse(saved, storeName);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MerchantOfferResponse> getMerchantOffers(
            UUID storeId,
            OfferStatus status,
            OfferApprovalStatus approvalStatus,
            Pageable pageable,
            UUID currentUserId) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);

        Specification<Offer> spec = OfferSpecification.filter(
                merchant.getId(),
                storeId,
                null,
                status,
                approvalStatus,
                null,
                null
        );

        return offerRepository.findAll(spec, pageable)
                .map(offer -> offerMapper.toMerchantResponse(offer, getStoreName(offer.getStoreId())));
    }

    @Override
    @Transactional(readOnly = true)
    public MerchantOfferResponse getMerchantOfferById(UUID offerId, UUID currentUserId) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        if (!offer.getMerchantId().equals(merchant.getId())) {
            throw new AppException("You do not have permission to access this offer", ApiError.OFFER_ACCESS_DENIED, 403);
        }

        return offerMapper.toMerchantResponse(offer, getStoreName(offer.getStoreId()));
    }

    @Override
    @Transactional
    public MerchantOfferResponse updateMerchantOffer(UUID offerId, UpdateOfferRequest request, UUID currentUserId) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        if (!offer.getMerchantId().equals(merchant.getId())) {
            throw new AppException("You do not have permission to access this offer", ApiError.OFFER_ACCESS_DENIED, 403);
        }

        offerValidator.validateModifiable(offer);
        offerValidator.validateUpdateRequest(request);

        Store store = null;
        if (request.storeId() != null) {
            store = storeRepository.findById(request.storeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND));

            if (!store.getMerchantId().equals(merchant.getId())) {
                throw new AppException("You do not have permission to access this store", ApiError.OFFER_ACCESS_DENIED, 403);
            }

            if (store.getApprovalStatus() != ApprovalStatus.APPROVED || store.getStatus() != StoreStatus.ACTIVE) {
                throw new AppException("Store is not active or approved", ApiError.STORE_NOT_ELIGIBLE, 400);
            }
        }

        offer.setStoreId(request.storeId());
        offer.setTitle(request.title().trim());
        offer.setDescription(request.description() != null ? request.description().trim() : null);
        offer.setType(request.offerType());
        offer.setValue(request.value());
        offer.setMinTransactionAmount(request.minTransactionAmount());
        offer.setMaxDiscountAmount(request.maxDiscountAmount());
        offer.setUsageLimit(request.usageLimit());
        offer.setPerCustomerLimit(request.perCustomerLimit());
        offer.setValidFrom(request.validFrom());
        offer.setValidTo(request.validTo());
        if (request.offerScope() != null) offer.setOfferScope(request.offerScope());
        if (request.originalMrp() != null) offer.setOriginalMrp(request.originalMrp());
        if (request.flashSellingPrice() != null) offer.setFlashSellingPrice(request.flashSellingPrice());
        if (request.isFlash() != null) offer.setIsFlash(request.isFlash());
        if (request.remainingQuantity() != null) offer.setRemainingQuantity(request.remainingQuantity());
        if (request.bonusCoins() != null) offer.setBonusCoins(request.bonusCoins());
        if (request.imageUrl() != null) offer.setImageUrl(request.imageUrl());
        if (request.badgeText() != null) offer.setBadgeText(request.badgeText());
        if (request.ctaText() != null) offer.setCtaText(request.ctaText());

        // If offer was previously approved, modifying it requires re-approval
        if (offer.getApprovalStatus() == OfferApprovalStatus.APPROVED || offer.getStatus() == OfferStatus.ACTIVE) {
            log.info("Offer id={} was previously APPROVED. Resetting to DRAFT for re-approval.", offer.getId());
            offer.setApprovalStatus(OfferApprovalStatus.DRAFT);
            offer.setStatus(OfferStatus.CREATED);
        }

        offer.setUpdatedBy(currentUserId.toString());
        Offer updated = offerRepository.save(offer);

        if (auditService != null) {
            auditService.record(
                    AuditEventType.OFFER_UPDATED,
                    currentUserId,
                    null,
                    null,
                    MDC.get("requestId"),
                    "Updated offer id=" + updated.getId()
            );
        }

        evictOfferCaches(updated);
        String storeName = store != null ? store.getStoreName() : getStoreName(updated.getStoreId());
        return offerMapper.toMerchantResponse(updated, storeName);
    }

    @Override
    @Transactional
    public MerchantOfferResponse toggleMerchantOfferStatus(UUID offerId, OfferStatus status, UUID currentUserId) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        if (!offer.getMerchantId().equals(merchant.getId())) {
            throw new AppException("You do not have permission to access this offer", ApiError.OFFER_ACCESS_DENIED, 403);
        }

        if (status == OfferStatus.PAUSED) {
            offer.setStatus(OfferStatus.PAUSED);
            log.info("Merchant {} paused offer id={}", currentUserId, offerId);
            if (auditService != null) {
                auditService.record(AuditEventType.OFFER_PAUSED, currentUserId, null, null, MDC.get("requestId"), "Paused offer id=" + offerId);
            }
        } else if (status == OfferStatus.ACTIVE) {
            offer.setStatus(OfferStatus.ACTIVE);
            log.info("Merchant {} resumed offer id={}", currentUserId, offerId);
            if (auditService != null) {
                auditService.record(AuditEventType.OFFER_RESUMED, currentUserId, null, null, MDC.get("requestId"), "Resumed offer id=" + offerId);
            }
        } else {
            offer.setStatus(status);
        }

        offer.setUpdatedBy(currentUserId.toString());
        Offer saved = offerRepository.save(offer);
        evictOfferCaches(saved);
        return offerMapper.toMerchantResponse(saved, getStoreName(saved.getStoreId()));
    }

    @Override
    @Transactional
    public void deleteMerchantOffer(UUID offerId, UUID currentUserId) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        if (!offer.getMerchantId().equals(merchant.getId())) {
            throw new AppException("You do not have permission to access this offer", ApiError.OFFER_ACCESS_DENIED, 403);
        }

        offerRepository.delete(offer);
        log.info("Merchant {} deleted offer id={}", currentUserId, offerId);

        if (auditService != null) {
            auditService.record(AuditEventType.OFFER_DELETED, currentUserId, null, null, MDC.get("requestId"), "Deleted offer id=" + offerId);
        }

        evictOfferCaches(offer);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<com.superapp.common.audit.AuditLogResponse> getOfferAuditLogs(UUID offerId, UUID currentUserId) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        if (!offer.getMerchantId().equals(merchant.getId())) {
            throw new AppException("You do not have permission to access this offer", ApiError.OFFER_ACCESS_DENIED, 403);
        }

        List<com.superapp.common.audit.AuditLog> logs = auditLogRepository.findByMetadataContainingOrderByCreatedAtDesc(offerId.toString());
        return logs.stream().map(com.superapp.common.audit.AuditLogResponse::from).toList();
    }

    @Override
    @Transactional
    public OfferApprovalResponse submitOfferForApproval(UUID offerId, UUID currentUserId) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        if (!offer.getMerchantId().equals(merchant.getId())) {
            throw new AppException("You do not have permission to access this offer", ApiError.OFFER_ACCESS_DENIED, 403);
        }

        offerValidator.validateSubmittable(offer);

        if (offer.getStoreId() != null) {
            Store store = storeRepository.findById(offer.getStoreId())
                    .orElseThrow(() -> new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND));
            if (store.getApprovalStatus() != ApprovalStatus.APPROVED || store.getStatus() != StoreStatus.ACTIVE) {
                throw new AppException("Store is not eligible or approved", ApiError.STORE_NOT_ELIGIBLE, 400);
            }
        }

        offer.setApprovalStatus(OfferApprovalStatus.PENDING_APPROVAL);
        offer.setStatus(OfferStatus.PENDING_APPROVAL);
        offer.setUpdatedBy(currentUserId.toString());
        Offer saved = offerRepository.save(offer);

        log.info("Offer id={} submitted for approval by user={}", offerId, currentUserId);
        if (auditService != null) {
            auditService.record(
                    AuditEventType.OFFER_SUBMITTED,
                    currentUserId,
                    null,
                    null,
                    MDC.get("requestId"),
                    "Submitted offer id=" + saved.getId() + " for approval"
            );
        }

        evictOfferCaches(saved);
        return OfferApprovalResponse.submitted(saved.getId().toString());
    }

    // =========================================================================
    // Customer Operations
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public CustomerOfferDetailResponse getCustomerOfferDetails(UUID offerId) {
        String cacheKey = "offer:" + offerId;
        CustomerOfferDetailResponse cached = getFromCache("offers", cacheKey);
        if (cached != null) {
            return cached;
        }

        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        if (offer.getApprovalStatus() != OfferApprovalStatus.APPROVED
                || offer.getStatus() != OfferStatus.ACTIVE
                || offer.isExpired()) {
            throw new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND);
        }

        Merchant merchant = merchantRepository.findById(offer.getMerchantId())
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        if (merchant.getApprovalStatus() != ApprovalStatus.APPROVED || merchant.getStatus() != MerchantStatus.ACTIVE) {
            throw new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND);
        }

        Store store = null;
        if (offer.getStoreId() != null) {
            store = storeRepository.findById(offer.getStoreId()).orElse(null);
            if (store != null && (store.getApprovalStatus() != ApprovalStatus.APPROVED || store.getStatus() != StoreStatus.ACTIVE)) {
                throw new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND);
            }
        }

        CustomerOfferDetailResponse response = offerMapper.toCustomerDetailResponse(offer, store, merchant);
        putInCache("offers", cacheKey, response);
        return response;
    }

    // =========================================================================
    // Admin Operations
    // =========================================================================

    @Override
    @Transactional
    public MerchantOfferResponse createAdminOffer(AdminCreateOfferRequest request, UUID adminUserId) {
        Store store = null;
        UUID merchantId = request.merchantId();
        if (request.storeId() != null) {
            store = storeRepository.findById(request.storeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND));
            if (merchantId == null) {
                merchantId = store.getMerchantId();
            }
        }

        if (merchantId == null) {
            throw new AppException("Merchant ID is required", ApiError.MERCHANT_NOT_FOUND, 400);
        }

        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found", ApiError.MERCHANT_NOT_FOUND));

        Offer offer = new Offer();
        offer.setMerchantId(merchant.getId());
        offer.setStoreId(store != null ? store.getId() : null);
        offer.setCategoryId(merchant.getCategoryId());
        offer.setTitle(request.title().trim());
        offer.setDescription(request.description() != null ? request.description().trim() : null);
        offer.setTermsAndConditions(request.termsAndConditions() != null ? request.termsAndConditions().trim() : null);
        offer.setType(request.offerType());
        offer.setValue(request.value());
        offer.setMinTransactionAmount(request.minTransactionAmount() != null ? request.minTransactionAmount() : java.math.BigDecimal.ZERO);
        offer.setMaxDiscountAmount(request.maxDiscountAmount());
        offer.setUsageLimit(request.usageLimit() != null ? request.usageLimit() : 1000);
        offer.setPerCustomerLimit(request.perCustomerLimit() != null ? request.perCustomerLimit() : 1);
        offer.setCurrentUsageCount(0);
        offer.setValidFrom(request.validFrom() != null ? request.validFrom() : Instant.now());
        offer.setValidTo(request.validTo() != null ? request.validTo() : Instant.now().plus(90, java.time.temporal.ChronoUnit.DAYS));

        offer.setOfferScope(request.offerScope() != null ? request.offerScope() : "SERVICE");
        if (request.originalMrp() != null) offer.setOriginalMrp(request.originalMrp());
        if (request.flashSellingPrice() != null) offer.setFlashSellingPrice(request.flashSellingPrice());
        if (request.isFlash() != null) offer.setIsFlash(request.isFlash());
        if (request.remainingQuantity() != null) offer.setRemainingQuantity(request.remainingQuantity());
        offer.setBonusCoins(request.bonusCoins() != null ? request.bonusCoins() : 100);
        offer.setImageUrl(request.imageUrl());
        offer.setBadgeText(request.badgeText());
        offer.setCtaText(request.ctaText() != null ? request.ctaText() : "Book & Pay");

        // Super Admin offers are pre-approved and immediately ACTIVE
        offer.setStatus(OfferStatus.ACTIVE);
        offer.setApprovalStatus(OfferApprovalStatus.APPROVED);
        offer.setApprovedAt(Instant.now());
        offer.setApprovedBy(adminUserId);
        offer.setCreatedBy(adminUserId.toString());
        offer.setUpdatedBy(adminUserId.toString());

        Offer saved = offerRepository.save(offer);
        log.info("Super Admin {} created and activated offer id={} for merchant={} store={}",
                adminUserId, saved.getId(), merchant.getId(), saved.getStoreId());

        if (auditService != null) {
            auditService.record(
                    AuditEventType.OFFER_CREATED,
                    adminUserId,
                    null,
                    null,
                    MDC.get("requestId"),
                    "Admin created and approved offer id=" + saved.getId() + " title='" + saved.getTitle() + "'"
            );
        }

        evictOfferCaches(saved);
        String storeName = store != null ? store.getStoreName() : null;
        return offerMapper.toMerchantResponse(saved, storeName);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MerchantOfferResponse> getAdminOffers(Specification<Offer> spec, Pageable pageable) {
        return offerRepository.findAll(spec, pageable)
                .map(offer -> offerMapper.toMerchantResponse(offer, getStoreName(offer.getStoreId())));
    }

    @Override
    @Transactional(readOnly = true)
    public MerchantOfferResponse getAdminOfferById(UUID offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));
        return offerMapper.toMerchantResponse(offer, getStoreName(offer.getStoreId()));
    }

    @Override
    @Transactional
    public OfferApprovalResponse approveOffer(UUID offerId, UUID adminUserId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        offerValidator.validateApprovable(offer);

        Merchant merchant = merchantRepository.findById(offer.getMerchantId())
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        if (merchant.getApprovalStatus() != ApprovalStatus.APPROVED || merchant.getStatus() != MerchantStatus.ACTIVE) {
            throw new AppException("Cannot approve offer for inactive or unapproved merchant", ApiError.INVALID_MERCHANT_STATE, 400);
        }

        if (offer.getStoreId() != null) {
            Store store = storeRepository.findById(offer.getStoreId())
                    .orElseThrow(() -> new AppException("Store not found", ApiError.STORE_NOT_FOUND, 404));
            if (store.getApprovalStatus() != ApprovalStatus.APPROVED || store.getStatus() != StoreStatus.ACTIVE) {
                throw new AppException("Cannot approve offer for inactive or unapproved store", ApiError.STORE_NOT_ELIGIBLE, 400);
            }
        }

        offer.setApprovalStatus(OfferApprovalStatus.APPROVED);
        offer.setStatus(OfferStatus.ACTIVE);
        offer.setApprovedAt(Instant.now());
        offer.setApprovedBy(adminUserId);
        offer.setRejectionReason(null);
        offer.setUpdatedBy(adminUserId.toString());

        Offer saved = offerRepository.save(offer);
        log.info("Admin {} approved offer id={}", adminUserId, saved.getId());

        if (auditService != null) {
            auditService.record(
                    AuditEventType.OFFER_APPROVED,
                    adminUserId,
                    null,
                    null,
                    MDC.get("requestId"),
                    "Approved offer id=" + saved.getId()
            );
        }

        evictOfferCaches(saved);
        return OfferApprovalResponse.approved(saved.getId().toString());
    }

    @Override
    @Transactional
    public OfferApprovalResponse rejectOffer(UUID offerId, RejectOfferRequest request, UUID adminUserId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        offerValidator.validateRejectable(offer);

        offer.setApprovalStatus(OfferApprovalStatus.REJECTED);
        offer.setStatus(OfferStatus.REJECTED);
        offer.setRejectionReason(request.reason().trim());
        offer.setUpdatedBy(adminUserId.toString());

        Offer saved = offerRepository.save(offer);
        log.info("Admin {} rejected offer id={} reason: {}", adminUserId, saved.getId(), request.reason());

        if (auditService != null) {
            auditService.record(
                    AuditEventType.OFFER_REJECTED,
                    adminUserId,
                    null,
                    null,
                    MDC.get("requestId"),
                    "Rejected offer id=" + saved.getId() + " reason: " + request.reason()
            );
        }

        evictOfferCaches(saved);
        return OfferApprovalResponse.rejected(saved.getId().toString(), request.reason());
    }

    @Override
    @Transactional
    public OfferApprovalResponse suspendOffer(UUID offerId, String reason, UUID adminUserId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        offer.setStatus(OfferStatus.DEACTIVATED);
        offer.setRejectionReason(reason != null ? reason.trim() : "Suspended by admin");
        offer.setUpdatedBy(adminUserId.toString());

        Offer saved = offerRepository.save(offer);
        log.info("Admin {} suspended offer id={} reason: {}", adminUserId, saved.getId(), reason);

        if (auditService != null) {
            auditService.record(
                    AuditEventType.OFFER_DEACTIVATED,
                    adminUserId,
                    null,
                    null,
                    MDC.get("requestId"),
                    "Suspended offer id=" + saved.getId() + " reason: " + reason
            );
        }

        evictOfferCaches(saved);
        return OfferApprovalResponse.suspended(saved.getId().toString(), reason);
    }

    @Override
    @Transactional
    public void deleteAdminOffer(UUID offerId, UUID adminUserId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        offerRepository.delete(offer);
        log.info("Admin {} permanently deleted offer id={}", adminUserId, offerId);

        if (auditService != null) {
            auditService.record(
                    AuditEventType.OFFER_DELETED,
                    adminUserId,
                    null,
                    null,
                    MDC.get("requestId"),
                    "Admin deleted offer id=" + offerId
            );
        }

        evictOfferCaches(offer);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private Merchant getAuthenticatedMerchant(UUID currentUserId) {
        return merchantRepository.findByOwnerUserId(currentUserId)
                .orElseThrow(() -> new AppException("Merchant profile not found for authenticated user", ApiError.MERCHANT_NOT_FOUND, 404));
    }

    private String getStoreName(UUID storeId) {
        if (storeId == null) return null;
        return storeRepository.findById(storeId).map(Store::getStoreName).orElse(null);
    }

    private void evictOfferCaches(Offer offer) {
        try {
            Cache offersCache = cacheManager.getCache("offers");
            if (offersCache != null && offer.getId() != null) {
                offersCache.evict("offer:" + offer.getId());
            }

            Cache discoveryOffersCache = cacheManager.getCache("discovery_offers");
            if (discoveryOffersCache != null) {
                discoveryOffersCache.clear();
            }

            Cache discoveryNearbyCache = cacheManager.getCache("discovery_nearby");
            if (discoveryNearbyCache != null) {
                discoveryNearbyCache.clear();
            }
        } catch (Exception e) {
            log.warn("Cache eviction failed for offer id={}: {}", offer.getId(), e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private <T> T getFromCache(String cacheName, String key) {
        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                Cache.ValueWrapper wrapper = cache.get(key);
                if (wrapper != null) {
                    return (T) wrapper.get();
                }
            }
        } catch (Exception e) {
            log.warn("Cache read failed for key '{}' in cache '{}': {}", key, cacheName, e.getMessage());
        }
        return null;
    }

    private void putInCache(String cacheName, String key, Object value) {
        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null && value != null) {
                cache.put(key, value);
            }
        } catch (Exception e) {
            log.warn("Cache write failed for key '{}' in cache '{}': {}", key, cacheName, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public NearbyServiceOffersResponse getNearbyServiceOffers(
            Double latitude, Double longitude, Double radiusKm, UUID categoryId, Integer limit, String cursor) {

        int limitVal = (limit != null && limit > 0 && limit <= 50) ? limit : 10;
        Instant now = Instant.now();
        List<Offer> offers = new ArrayList<>();

        if (latitude != null && longitude != null) {
            double radiusMeters = (radiusKm != null && radiusKm > 0 ? radiusKm : 5.0) * 1000.0;
            Page<Store> nearbyStores = storeRepository.findNearbyApprovedStores(
                    latitude, longitude, radiusMeters, org.springframework.data.domain.PageRequest.of(0, 50));
            List<UUID> storeIds = nearbyStores.getContent().stream().map(Store::getId).toList();
            if (!storeIds.isEmpty()) {
                offers = offerRepository.findActiveServiceOffersByStoreIds(storeIds, now);
            }
            // Strict Geo-filter: When coordinates are supplied, strictly return only matching nearby offers (no fallback)
            if (offers.size() > limitVal) {
                offers = offers.subList(0, limitVal);
            }
        } else {
            // Only when no coordinates are provided (e.g. location disabled), show default category offers
            Page<Offer> page = offerRepository.findActiveServiceOffers(
                    categoryId, now, org.springframework.data.domain.PageRequest.of(0, limitVal));
            offers = page.getContent();
        }

        List<NearbyServiceOfferItemDto> dtos = new ArrayList<>();
        for (Offer o : offers) {
            Store store = o.getStoreId() != null ? storeRepository.findById(o.getStoreId()).orElse(null) : null;
            Merchant merchant = o.getMerchantId() != null ? merchantRepository.findById(o.getMerchantId()).orElse(null) : null;

            Integer distanceMeters = null;
            if (latitude != null && longitude != null && store != null && store.getLatitude() != null && store.getLongitude() != null) {
                double dist = calculateHaversineDistance(
                        latitude, longitude,
                        store.getLatitude().doubleValue(), store.getLongitude().doubleValue()
                );
                distanceMeters = (int) Math.round(dist);
            }

            NearbyServiceOfferItemDto.MerchantSummaryDto merchantSummary = new NearbyServiceOfferItemDto.MerchantSummaryDto(
                    o.getMerchantId() != null ? o.getMerchantId().toString() : null,
                    merchant != null ? merchant.getBusinessName() : (store != null ? store.getStoreName() : "Partner Store"),
                    store != null ? store.getImageUrl() : null,
                    merchant != null && merchant.getKycStatus() != null && "VERIFIED".equalsIgnoreCase(merchant.getKycStatus().name())
            );

            NearbyServiceOfferItemDto.BranchSummaryDto branchSummary = new NearbyServiceOfferItemDto.BranchSummaryDto(
                    o.getStoreId() != null ? o.getStoreId().toString() : null,
                    store != null ? store.getStoreName() : "Main Branch",
                    distanceMeters
            );

            String imgUrl = o.getImageUrl() != null ? o.getImageUrl() : (store != null ? store.getImageUrl() : null);
            Integer coins = o.getBonusCoins() != null ? o.getBonusCoins() : 100;
            NearbyServiceOfferItemDto.RewardSummaryDto rewardSummary = new NearbyServiceOfferItemDto.RewardSummaryDto(
                    coins, "+" + coins + " Coins"
            );

            dtos.add(new NearbyServiceOfferItemDto(
                    o.getId() != null ? o.getId().toString() : null,
                    o.getTitle(),
                    o.getDescription(),
                    o.getType() != null ? o.getType().name() : "PERCENTAGE_DISCOUNT",
                    o.getValue(),
                    o.getMaxDiscountAmount(),
                    o.getMinTransactionAmount(),
                    merchantSummary,
                    branchSummary,
                    imgUrl,
                    o.getValidTo(),
                    rewardSummary,
                    o.getCtaText() != null ? o.getCtaText() : "Book & Pay",
                    "CHECK_REQUIRED"
            ));
        }

        return new NearbyServiceOffersResponse(dtos, DiscoverPaginationDto.of(limitVal, false));
    }

    @Override
    @Transactional(readOnly = true)
    public FlashDealsResponse getActiveFlashDeals(
            Double latitude, Double longitude, UUID categoryId, Integer limit, String cursor) {

        int limitVal = (limit != null && limit > 0 && limit <= 50) ? limit : 10;
        Instant now = Instant.now();
        Page<Offer> page = offerRepository.findActiveFlashDeals(
                categoryId, now, org.springframework.data.domain.PageRequest.of(0, limitVal));

        List<FlashDealItemDto> dtos = new ArrayList<>();
        for (Offer o : page.getContent()) {
            java.math.BigDecimal sellingPrice = o.getFlashSellingPrice() != null ? o.getFlashSellingPrice() : o.getValue();
            java.math.BigDecimal mrp = o.getOriginalMrp() != null ? o.getOriginalMrp() : (sellingPrice.multiply(new java.math.BigDecimal("1.5")));

            FlashDealItemDto.PriceDetailsDto priceDetails = new FlashDealItemDto.PriceDetailsDto(
                    "INR",
                    sellingPrice,
                    mrp
            );

            dtos.add(new FlashDealItemDto(
                    o.getId() != null ? o.getId().toString() : null,
                    o.getTitle(),
                    o.getImageUrl(),
                    o.getBadgeText() != null ? o.getBadgeText() : "FLASH DEAL",
                    o.getType() != null ? o.getType().name() : "PERCENTAGE_DISCOUNT",
                    priceDetails,
                    o.getValidFrom(),
                    o.getValidTo(),
                    o.getRemainingQuantity() != null ? o.getRemainingQuantity() : 25,
                    o.getStoreId() != null ? o.getStoreId().toString() : null,
                    "CHECK_REQUIRED"
            ));
        }

        return new FlashDealsResponse(dtos, DiscoverPaginationDto.of(limitVal, page.hasNext()));
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
