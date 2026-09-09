package com.superapp.store.service;

import com.superapp.common.exception.AppException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.store.dto.CreateStoreRequest;
import com.superapp.store.dto.StoreResponse;
import com.superapp.store.dto.UpdateStoreRequest;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class StoreServiceImpl implements StoreService {

    private static final Logger log = LoggerFactory.getLogger(StoreServiceImpl.class);

    private final StoreRepository storeRepository;
    private final MerchantRepository merchantRepository;

    public StoreServiceImpl(StoreRepository storeRepository, MerchantRepository merchantRepository) {
        this.storeRepository = storeRepository;
        this.merchantRepository = merchantRepository;
    }

    @Override
    @Transactional
    public StoreResponse createStore(CreateStoreRequest request, UUID currentUserId, boolean isAdmin) {
        Merchant merchant = merchantRepository.findById(request.merchantId())
                .orElseThrow(() -> new ResourceNotFoundException("Merchant", "id", request.merchantId()));

        if (!isAdmin && !merchant.getOwnerUserId().equals(currentUserId)) {
            throw new AppException("You are not authorized to create stores for this merchant", ApiError.FORBIDDEN, 403);
        }

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

        ApprovalStatus oldStatus = store.getStatus();
        store.setStatus(request.status());
        Store updated = storeRepository.save(store);
        log.info("Admin updated store id={} status from {} to {}. Notes: {}",
                id, oldStatus, request.status(), request.notes());

        return StoreResponse.fromEntity(updated, getMerchantName(updated.getMerchantId()));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoreResponse> findNearbyStores(double latitude, double longitude, double radiusMeters, Pageable pageable) {
        if (latitude < -90.0 || latitude > 90.0) {
            throw new AppException("Latitude must be between -90 and 90", ApiError.VALIDATION_FAILED, 400);
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new AppException("Longitude must be between -180 and 180", ApiError.VALIDATION_FAILED, 400);
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

    private String getMerchantName(UUID merchantId) {
        if (merchantId == null) return null;
        return merchantRepository.findById(merchantId)
                .map(Merchant::getBusinessName)
                .orElse(null);
    }
}
