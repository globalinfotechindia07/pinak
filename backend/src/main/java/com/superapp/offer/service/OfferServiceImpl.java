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
}
