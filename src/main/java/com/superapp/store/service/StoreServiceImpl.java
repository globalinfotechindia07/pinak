package com.superapp.store.service;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.store.dto.*;
import com.superapp.store.entity.City;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.mapper.StoreMapper;
import com.superapp.store.repository.CityRepository;
import com.superapp.store.repository.StoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
public class StoreServiceImpl implements StoreService {

    private static final Logger log = LoggerFactory.getLogger(StoreServiceImpl.class);

    private final StoreRepository storeRepository;
    private final MerchantRepository merchantRepository;
    private final CityRepository cityRepository;
    private final AuditService auditService;
    private final StoreMapper storeMapper;

    public StoreServiceImpl(
            StoreRepository storeRepository,
            MerchantRepository merchantRepository,
            CityRepository cityRepository,
            AuditService auditService,
            StoreMapper storeMapper
    ) {
        this.storeRepository = storeRepository;
        this.merchantRepository = merchantRepository;
        this.cityRepository = cityRepository;
        this.auditService = auditService;
        this.storeMapper = storeMapper != null ? storeMapper : new StoreMapper();
    }

    // Overloaded constructor for backward compatibility with existing unit tests
    public StoreServiceImpl(StoreRepository storeRepository, MerchantRepository merchantRepository) {
        this(storeRepository, merchantRepository, null, null, new StoreMapper());
    }

    // =========================================================================
    // Merchant Scoped Operations (Ownership & IDOR Enforced)
    // =========================================================================

    @Override
    @Transactional
    public StoreResponse createMerchantStore(MerchantCreateStoreRequest request, UUID currentUserId) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);

        validateCoordinates(request.latitude(), request.longitude());
        validateCity(request.cityId());

        Store store = new Store(
                merchant.getId(),
                request.name().trim(),
                request.description() != null ? request.description().trim() : null,
                request.addressLine1().trim(),
                request.addressLine2() != null ? request.addressLine2().trim() : null,
                request.cityId(),
                request.state().trim(),
                request.pincode().trim(),
                request.latitude(),
                request.longitude(),
                request.phone() != null ? request.phone().trim() : null
        );
        store.setCreatedBy(currentUserId.toString());
        store.setUpdatedBy(currentUserId.toString());

        Store saved = storeRepository.save(store);
        log.info("Created store id={} name='{}' for merchantId={}", saved.getId(), saved.getName(), merchant.getId());

        if (auditService != null) {
            auditService.record(AuditEventType.STORE_CREATED, currentUserId, null, null, MDC.get("requestId"),
                    "{\"storeId\":\"" + saved.getId() + "\",\"merchantId\":\"" + merchant.getId() + "\"}");
        }

        return storeMapper.toResponse(saved, merchant.getBusinessName(), getCityName(saved.getCityId()));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoreResponse> getMerchantStores(UUID currentUserId, Pageable pageable, StoreStatus status, ApprovalStatus approvalStatus) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);

        Page<Store> stores;
        if (status != null && approvalStatus != null) {
            stores = storeRepository.findByMerchantIdAndStatusAndApprovalStatus(merchant.getId(), status, approvalStatus, pageable);
        } else if (status != null) {
            stores = storeRepository.findByMerchantIdAndStatus(merchant.getId(), status, pageable);
        } else if (approvalStatus != null) {
            stores = storeRepository.findByMerchantIdAndApprovalStatus(merchant.getId(), approvalStatus, pageable);
        } else {
            stores = storeRepository.findByMerchantId(merchant.getId(), pageable);
        }

        return stores.map(s -> storeMapper.toResponse(s, merchant.getBusinessName(), getCityName(s.getCityId())));
    }

    @Override
    @Transactional(readOnly = true)
    public StoreResponse getMerchantStoreById(UUID storeId, UUID currentUserId) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);
        Store store = getOwnedStore(storeId, merchant.getId());
        return storeMapper.toResponse(store, merchant.getBusinessName(), getCityName(store.getCityId()));
    }

    @Override
    @Transactional
    public StoreResponse updateMerchantStore(UUID storeId, MerchantUpdateStoreRequest request, UUID currentUserId) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);
        Store store = getOwnedStore(storeId, merchant.getId());

        validateCoordinates(request.latitude(), request.longitude());
        validateCity(request.cityId());

        boolean locationChanged = !Objects.equals(store.getLatitude(), request.latitude())
                || !Objects.equals(store.getLongitude(), request.longitude())
                || !Objects.equals(store.getCityId(), request.cityId())
                || !Objects.equals(store.getAddressLine1(), request.addressLine1())
                || !Objects.equals(store.getAddressLine2(), request.addressLine2())
                || !Objects.equals(store.getPincode(), request.pincode());

        store.setName(request.name().trim());
        store.setDescription(request.description() != null ? request.description().trim() : null);
        store.setAddressLine1(request.addressLine1().trim());
        store.setAddressLine2(request.addressLine2() != null ? request.addressLine2().trim() : null);
        store.setAddress(buildAddress(request.addressLine1(), request.addressLine2()));
        store.setCityId(request.cityId());
        store.setState(request.state().trim());
        store.setPincode(request.pincode().trim());
        store.setLatitude(request.latitude());
        store.setLongitude(request.longitude());
        store.setLocation(Store.formatWkt(request.longitude(), request.latitude()));
        store.setPhone(request.phone() != null ? request.phone().trim() : null);
        store.setUpdatedBy(currentUserId.toString());

        if (locationChanged) {
            store.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
            log.info("Store id={} address or coordinates changed, reset approval status to PENDING_APPROVAL", storeId);
            if (auditService != null) {
                auditService.record(AuditEventType.STORE_LOCATION_CHANGED, currentUserId, null, null, MDC.get("requestId"),
                        "{\"storeId\":\"" + storeId + "\",\"lat\":" + request.latitude() + ",\"lng\":" + request.longitude() + "}");
            }
        }

        Store updated = storeRepository.save(store);
        log.info("Updated store id={} by merchant owner={}", updated.getId(), currentUserId);

        if (auditService != null) {
            auditService.record(AuditEventType.STORE_UPDATED, currentUserId, null, null, MDC.get("requestId"),
                    "{\"storeId\":\"" + updated.getId() + "\"}");
        }

        return storeMapper.toResponse(updated, merchant.getBusinessName(), getCityName(updated.getCityId()));
    }

    @Override
    @Transactional
    public StoreApprovalActionResponse submitStoreForApproval(UUID storeId, UUID currentUserId) {
        Merchant merchant = getAuthenticatedMerchant(currentUserId);
        Store store = getOwnedStore(storeId, merchant.getId());

        if (store.getName() == null || store.getName().isBlank()
                || store.getAddressLine1() == null || store.getAddressLine1().isBlank()
                || store.getCityId() == null || store.getCityId().isBlank()
                || store.getState() == null || store.getState().isBlank()
                || store.getPincode() == null || store.getPincode().isBlank()
                || store.getLatitude() == null || store.getLongitude() == null) {
            throw new AppException("Incomplete store details cannot be submitted for approval", ApiError.VALIDATION_ERROR, 400);
        }

        if (store.getApprovalStatus() == ApprovalStatus.APPROVED) {
            throw new AppException("Store is already approved", ApiError.INVALID_STORE_STATE, 409);
        }

        store.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        store.setUpdatedBy(currentUserId.toString());
        storeRepository.save(store);

        log.info("Merchant owner={} submitted store id={} for approval", currentUserId, storeId);

        if (auditService != null) {
            auditService.record(AuditEventType.STORE_SUBMITTED, currentUserId, null, null, MDC.get("requestId"),
                    "{\"storeId\":\"" + storeId + "\"}");
        }

        return StoreApprovalActionResponse.submitted(storeId.toString());
    }

    // =========================================================================
    // Admin Store Operations
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<StoreResponse> getAllStoresAdmin(Pageable pageable, StoreStatus status, ApprovalStatus approvalStatus, String cityId) {
        return storeRepository.findAllAdmin(status, approvalStatus, cityId, pageable)
                .map(s -> storeMapper.toResponse(s, getMerchantName(s.getMerchantId()), getCityName(s.getCityId())));
    }

    @Override
    @Transactional(readOnly = true)
    public StoreResponse getStoreByIdAdmin(UUID storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException("Store not found", ApiError.STORE_NOT_FOUND, 404));
        return storeMapper.toResponse(store, getMerchantName(store.getMerchantId()), getCityName(store.getCityId()));
    }

    @Override
    @Transactional
    public StoreApprovalActionResponse approveStore(UUID storeId, UUID adminUserId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException("Store not found", ApiError.STORE_NOT_FOUND, 404));

        if (store.getApprovalStatus() == ApprovalStatus.APPROVED) {
            throw new AppException("Store cannot be approved in its current state", ApiError.INVALID_STORE_STATE, 409);
        }

        store.setApprovalStatus(ApprovalStatus.APPROVED);
        store.setApprovedAt(Instant.now());
        store.setUpdatedBy(adminUserId != null ? adminUserId.toString() : "ADMIN");
        storeRepository.save(store);

        log.info("Admin {} approved store id={}", adminUserId, storeId);

        if (auditService != null) {
            auditService.record(AuditEventType.STORE_APPROVED, adminUserId, null, null, MDC.get("requestId"),
                    "{\"storeId\":\"" + storeId + "\",\"adminUserId\":\"" + adminUserId + "\"}");
        }

        return StoreApprovalActionResponse.approved(storeId.toString());
    }

    @Override
    @Transactional
    public StoreApprovalActionResponse rejectStore(UUID storeId, String reason, UUID adminUserId) {
        if (reason == null || reason.isBlank()) {
            throw new AppException("Rejection reason is required", ApiError.VALIDATION_ERROR, 400);
        }

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException("Store not found", ApiError.STORE_NOT_FOUND, 404));

        if (store.getApprovalStatus() == ApprovalStatus.APPROVED) {
            throw new AppException("Store cannot be rejected in its current state", ApiError.INVALID_STORE_STATE, 409);
        }

        store.setApprovalStatus(ApprovalStatus.REJECTED);
        store.setRejectionReason(reason.trim());
        store.setUpdatedBy(adminUserId != null ? adminUserId.toString() : "ADMIN");
        storeRepository.save(store);

        log.info("Admin {} rejected store id={} reason: {}", adminUserId, storeId, reason);

        if (auditService != null) {
            auditService.record(AuditEventType.STORE_REJECTED, adminUserId, null, null, MDC.get("requestId"),
                    "{\"storeId\":\"" + storeId + "\",\"reason\":\"" + reason + "\"}");
        }

        return StoreApprovalActionResponse.rejected(storeId.toString(), reason.trim());
    }

    @Override
    @Transactional
    public StoreApprovalActionResponse suspendStore(UUID storeId, String reason, UUID adminUserId) {
        if (reason == null || reason.isBlank()) {
            throw new AppException("Suspension reason is required", ApiError.VALIDATION_ERROR, 400);
        }

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException("Store not found", ApiError.STORE_NOT_FOUND, 404));

        store.setStatus(StoreStatus.SUSPENDED);
        store.setSuspensionReason(reason.trim());
        store.setUpdatedBy(adminUserId != null ? adminUserId.toString() : "ADMIN");
        storeRepository.save(store);

        log.info("Admin {} suspended store id={} reason: {}", adminUserId, storeId, reason);

        if (auditService != null) {
            auditService.record(AuditEventType.STORE_SUSPENDED, adminUserId, null, null, MDC.get("requestId"),
                    "{\"storeId\":\"" + storeId + "\",\"reason\":\"" + reason + "\"}");
        }

        return StoreApprovalActionResponse.suspended(storeId.toString(), reason.trim());
    }

    // =========================================================================
    // Legacy & Public Discovery Operations
    // =========================================================================

    @Override
    @Transactional
    public StoreResponse createStore(CreateStoreRequest request, UUID currentUserId, boolean isAdmin) {
        Merchant merchant = merchantRepository.findById(request.merchantId())
                .orElseThrow(() -> new ResourceNotFoundException("Merchant", "id", request.merchantId()));

        if (!isAdmin && !merchant.getOwnerUserId().equals(currentUserId)) {
            throw new AppException("You are not authorized to create stores for this merchant", ApiError.FORBIDDEN, 403);
        }

        validateCoordinates(request.latitude(), request.longitude());

        Store store = new Store(
                request.merchantId(),
                request.storeName().trim(),
                request.address().trim(),
                request.cityId(),
                request.state().trim(),
                request.pincode().trim(),
                request.latitude(),
                request.longitude()
        );

        Store saved = storeRepository.save(store);
        log.info("Created store id={} name='{}' for merchantId={}", saved.getId(), saved.getStoreName(), merchant.getId());
        return StoreResponse.fromEntity(saved, merchant.getBusinessName());
    }

    @Override
    @Transactional(readOnly = true)
    public StoreResponse getStoreById(UUID id) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Store", "id", id));
        String merchantName = getMerchantName(store.getMerchantId());
        return StoreResponse.fromEntity(store, merchantName);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoreResponse> getAllStores(Pageable pageable) {
        return storeRepository.findAll(pageable)
                .map(s -> StoreResponse.fromEntity(s, getMerchantName(s.getMerchantId())));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoreResponse> getStoresByMerchantId(UUID merchantId, Pageable pageable) {
        if (!merchantRepository.existsById(merchantId)) {
            throw new ResourceNotFoundException("Merchant", "id", merchantId);
        }
        String merchantName = getMerchantName(merchantId);
        return storeRepository.findByMerchantId(merchantId, pageable)
                .map(s -> StoreResponse.fromEntity(s, merchantName));
    }

    @Override
    @Transactional
    public StoreResponse updateStore(UUID id, UpdateStoreRequest request, UUID currentUserId, boolean isAdmin) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Store", "id", id));

        Merchant merchant = merchantRepository.findById(store.getMerchantId())
                .orElseThrow(() -> new ResourceNotFoundException("Merchant", "id", store.getMerchantId()));

        if (!isAdmin && !merchant.getOwnerUserId().equals(currentUserId)) {
            throw new AppException("You are not authorized to modify this store", ApiError.FORBIDDEN, 403);
        }

        validateCoordinates(request.latitude(), request.longitude());

        store.setStoreName(request.storeName().trim());
        store.setAddress(request.address().trim());
        store.setCityId(request.cityId());
        store.setState(request.state().trim());
        store.setPincode(request.pincode().trim());
        store.setLatitude(request.latitude());
        store.setLongitude(request.longitude());

        Store updated = storeRepository.save(store);
        log.info("Updated store id={} name='{}'", updated.getId(), updated.getStoreName());
        return StoreResponse.fromEntity(updated, merchant.getBusinessName());
    }

    @Override
    @Transactional
    public void deleteStore(UUID id, UUID currentUserId, boolean isAdmin) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Store", "id", id));

        Merchant merchant = merchantRepository.findById(store.getMerchantId())
                .orElseThrow(() -> new ResourceNotFoundException("Merchant", "id", store.getMerchantId()));

        if (!isAdmin && !merchant.getOwnerUserId().equals(currentUserId)) {
            throw new AppException("You are not authorized to delete this store", ApiError.FORBIDDEN, 403);
        }

        storeRepository.delete(store);
        log.info("Deleted store id={} by user={}", id, currentUserId);
    }

    @Override
    @Transactional
    public StoreResponse updateApprovalStatus(UUID id, UpdateApprovalStatusRequest request) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Store", "id", id));

        ApprovalStatus oldStatus = store.getApprovalStatus();
        store.setApprovalStatus(request.status());
        if (request.status() == ApprovalStatus.APPROVED) {
            store.setApprovedAt(Instant.now());
        }
        Store updated = storeRepository.save(store);
        log.info("Admin updated store id={} status from {} to {}. Notes: {}",
                id, oldStatus, request.status(), request.notes());

        return StoreResponse.fromEntity(updated, getMerchantName(updated.getMerchantId()));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoreResponse> findNearbyStores(double latitude, double longitude, double radiusMeters, Pageable pageable) {
        if (latitude < -90.0 || latitude > 90.0) {
            throw new AppException("Latitude must be between -90 and 90", ApiError.INVALID_LOCATION, 400);
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new AppException("Longitude must be between -180 and 180", ApiError.INVALID_LOCATION, 400);
        }
        if (radiusMeters <= 0) {
            throw new AppException("Radius must be greater than 0 meters", ApiError.VALIDATION_FAILED, 400);
        }

        return storeRepository.findNearbyApprovedStores(latitude, longitude, radiusMeters, pageable)
                .map(store -> {
                    double dist = calculateDistanceMeters(
                            latitude, longitude,
                            store.getLatitude().doubleValue(),
                            store.getLongitude().doubleValue()
                    );
                    return StoreResponse.fromEntity(store, getMerchantName(store.getMerchantId()), Math.round(dist * 10.0) / 10.0);
                });
    }

    // =========================================================================
    // Internal Helper Methods
    // =========================================================================

    private Merchant getAuthenticatedMerchant(UUID currentUserId) {
        Merchant merchant = merchantRepository.findByOwnerUserId(currentUserId)
                .orElseThrow(() -> new AppException("Merchant not found for current user", ApiError.MERCHANT_NOT_FOUND, 404));

        if (merchant.isSuspended()) {
            throw new AppException("Merchant is suspended", ApiError.ACCOUNT_INACTIVE, 403);
        }
        return merchant;
    }

    private Store getOwnedStore(UUID storeId, UUID merchantId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException("Store not found", ApiError.STORE_NOT_FOUND, 404));

        if (!store.getMerchantId().equals(merchantId)) {
            throw new AppException("You do not have permission to access this store", ApiError.STORE_ACCESS_DENIED, 403);
        }
        return store;
    }

    private void validateCoordinates(BigDecimal latitude, BigDecimal longitude) {
        if (latitude == null || latitude.compareTo(new BigDecimal("-90.0")) < 0 || latitude.compareTo(new BigDecimal("90.0")) > 0) {
            throw new AppException("Latitude must be between -90 and 90", ApiError.INVALID_LOCATION, 400);
        }
        if (longitude == null || longitude.compareTo(new BigDecimal("-180.0")) < 0 || longitude.compareTo(new BigDecimal("180.0")) > 0) {
            throw new AppException("Longitude must be between -180 and 180", ApiError.INVALID_LOCATION, 400);
        }
    }

    private void validateCity(String cityId) {
        if (cityRepository != null && cityId != null && !cityId.isBlank()) {
            City city = cityRepository.findById(cityId)
                    .orElseThrow(() -> new AppException("City not found", ApiError.CITY_NOT_FOUND, 404));
            if (!city.isActive()) {
                throw new AppException("City is not active", ApiError.CITY_INACTIVE, 409);
            }
        }
    }

    private String buildAddress(String line1, String line2) {
        if (line1 == null || line1.isBlank()) {
            return line2 != null ? line2.trim() : "";
        }
        if (line2 == null || line2.isBlank()) {
            return line1.trim();
        }
        return line1.trim() + ", " + line2.trim();
    }

    private String getMerchantName(UUID merchantId) {
        if (merchantId == null) return null;
        return merchantRepository.findById(merchantId)
                .map(Merchant::getBusinessName)
                .orElse(null);
    }

    private String getCityName(String cityId) {
        if (cityId == null || cityRepository == null) return null;
        return cityRepository.findById(cityId)
                .map(City::getName)
                .orElse(null);
    }

    private double calculateDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
