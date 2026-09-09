package com.superapp.store.service;

import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.store.dto.CreateStoreRequest;
import com.superapp.store.dto.StoreResponse;
import com.superapp.store.dto.UpdateStoreRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StoreService {

    StoreResponse createStore(CreateStoreRequest request, UUID currentUserId, boolean isAdmin);

    StoreResponse getStoreById(UUID id);

    Page<StoreResponse> getAllStores(Pageable pageable);

    Page<StoreResponse> getStoresByMerchantId(UUID merchantId, Pageable pageable);

    StoreResponse updateStore(UUID id, UpdateStoreRequest request, UUID currentUserId, boolean isAdmin);

    void deleteStore(UUID id, UUID currentUserId, boolean isAdmin);

    StoreResponse updateApprovalStatus(UUID id, UpdateApprovalStatusRequest request);

    Page<StoreResponse> findNearbyStores(double latitude, double longitude, double radiusMeters, Pageable pageable);
}
