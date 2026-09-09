package com.superapp.store.dto;

import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.store.entity.Store;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record StoreResponse(
        UUID id,
        UUID merchantId,
        String merchantName,
        String storeName,
        String address,
        String cityId,
        String state,
        String pincode,
        BigDecimal latitude,
        BigDecimal longitude,
        ApprovalStatus status,
        Double distanceMeters,
        Instant createdAt,
        Instant updatedAt
) {
    public static StoreResponse fromEntity(Store store, String merchantName) {
        return fromEntity(store, merchantName, null);
    }

    public static StoreResponse fromEntity(Store store, String merchantName, Double distanceMeters) {
        if (store == null) return null;
        return new StoreResponse(
                store.getId(),
                store.getMerchantId(),
                merchantName,
                store.getStoreName(),
                store.getAddress(),
                store.getCityId(),
                store.getState(),
                store.getPincode(),
                store.getLatitude(),
                store.getLongitude(),
                store.getStatus(),
                distanceMeters,
                store.getCreatedAt(),
                store.getUpdatedAt()
        );
    }
}
