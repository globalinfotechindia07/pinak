package com.superapp.store.service;

import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.store.dto.*;
import com.superapp.store.enums.StoreStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StoreService {

    // Merchant self-service operations (ownership-aware)
    StoreResponse createMerchantStore(MerchantCreateStoreRequest request, UUID currentUserId);

    Page<StoreResponse> getMerchantStores(UUID currentUserId, Pageable pageable, StoreStatus status, ApprovalStatus approvalStatus);

    StoreResponse getMerchantStoreById(UUID storeId, UUID currentUserId);

    StoreResponse updateMerchantStore(UUID storeId, MerchantUpdateStoreRequest request, UUID currentUserId);

    StoreApprovalActionResponse submitStoreForApproval(UUID storeId, UUID currentUserId);

    // Admin store operations
    Page<StoreResponse> getAllStoresAdmin(Pageable pageable, StoreStatus status, ApprovalStatus approvalStatus, String cityId);

    StoreResponse getStoreByIdAdmin(UUID storeId);

    StoreApprovalActionResponse approveStore(UUID storeId, UUID adminUserId);

    StoreApprovalActionResponse rejectStore(UUID storeId, String reason, UUID adminUserId);

    StoreApprovalActionResponse suspendStore(UUID storeId, String reason, UUID adminUserId);

    StoreApprovalActionResponse activateStore(UUID storeId, String reason, UUID adminUserId);

    // Legacy & Public discovery operations
    StoreResponse createStore(CreateStoreRequest request, UUID currentUserId, boolean isAdmin);

    StoreResponse getStoreById(UUID id);

    Page<StoreResponse> getAllStores(Pageable pageable);

    Page<StoreResponse> getStoresByMerchantId(UUID merchantId, Pageable pageable);

    StoreResponse updateStore(UUID id, UpdateStoreRequest request, UUID currentUserId, boolean isAdmin);

    void deleteStore(UUID id, UUID currentUserId, boolean isAdmin);

    StoreResponse updateApprovalStatus(UUID id, UpdateApprovalStatusRequest request);

    Page<StoreResponse> findNearbyStores(double latitude, double longitude, double radiusMeters, Pageable pageable);
}
