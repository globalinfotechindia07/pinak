package com.superapp.store.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.store.entity.Store;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record StoreResponse(
        String id,
        String merchantId,
        String merchantName,
        String name,
        String storeName,
        String description,
        String addressLine1,
        String addressLine2,
        String address,
        String cityId,
        String cityName,
        String state,
        String pincode,
        BigDecimal latitude,
        BigDecimal longitude,
        String phone,
        String openingTime,
        String closingTime,
        String operatingDays,
        List<String> menuImages,
        List<String> photos,
        List<String> amenities,
        String status,
        String approvalStatus,
        String rejectionReason,
        String suspensionReason,
        Double distanceMeters,
        Instant approvedAt,
        Instant createdAt,
        Instant updatedAt,
        BigDecimal cashbackPercentage,
        BigDecimal maxCashbackAmount,
        BigDecimal minTransactionForCashback,
        Boolean isCashbackEnabled
) {
    public static StoreResponse fromEntity(Store store) {
        return fromEntity(store, null, null, null);
    }

    public static StoreResponse fromEntity(Store store, String merchantName) {
        return fromEntity(store, merchantName, null, null);
    }

    public static StoreResponse fromEntity(Store store, String merchantName, Double distanceMeters) {
        return fromEntity(store, merchantName, null, distanceMeters);
    }

    public static StoreResponse fromEntity(Store store, String merchantName, String cityName, Double distanceMeters) {
        if (store == null) return null;
        return new StoreResponse(
                store.getId() != null ? store.getId().toString() : null,
                store.getMerchantId() != null ? store.getMerchantId().toString() : null,
                merchantName,
                store.getName(),
                store.getStoreName(),
                store.getDescription(),
                store.getAddressLine1(),
                store.getAddressLine2(),
                store.getAddress(),
                store.getCityId(),
                cityName,
                store.getState(),
                store.getPincode(),
                store.getLatitude(),
                store.getLongitude(),
                store.getPhone(),
                store.getOpeningTime(),
                store.getClosingTime(),
                store.getOperatingDays(),
                store.getMenuImages(),
                store.getPhotos(),
                store.getAmenities(),
                store.getStatus() != null ? store.getStatus().name() : null,
                store.getApprovalStatus() != null ? store.getApprovalStatus().name() : null,
                store.getRejectionReason(),
                store.getSuspensionReason(),
                distanceMeters,
                store.getApprovedAt(),
                store.getCreatedAt(),
                store.getUpdatedAt(),
                store.getCashbackPercentage(),
                store.getMaxCashbackAmount(),
                store.getMinTransactionForCashback(),
                store.getIsCashbackEnabled()
        );
    }

    // 24-parameter backward-compatible constructor for existing tests
    public StoreResponse(
            String id,
            String merchantId,
            String merchantName,
            String name,
            String storeName,
            String description,
            String addressLine1,
            String addressLine2,
            String address,
            String cityId,
            String cityName,
            String state,
            String pincode,
            BigDecimal latitude,
            BigDecimal longitude,
            String phone,
            String status,
            String approvalStatus,
            String rejectionReason,
            String suspensionReason,
            Double distanceMeters,
            Instant approvedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        this(
                id, merchantId, merchantName, name, storeName, description,
                addressLine1, addressLine2, address, cityId, cityName, state, pincode,
                latitude, longitude, phone, "10:00", "22:00", "Daily (Mon - Sun)", java.util.Collections.emptyList(), java.util.Collections.emptyList(), java.util.Collections.emptyList(),
                status, approvalStatus, rejectionReason, suspensionReason,
                distanceMeters, approvedAt, createdAt, updatedAt,
                BigDecimal.valueOf(5.00), BigDecimal.valueOf(150.00), BigDecimal.valueOf(100.00), true
        );
    }

    // 14-parameter backward-compatible constructor for existing tests
    public StoreResponse(UUID id, UUID merchantId, String merchantName, String storeName,
                         String address, String cityId, String state, String pincode,
                         BigDecimal latitude, BigDecimal longitude, ApprovalStatus status,
                         Double distanceMeters, Instant createdAt, Instant updatedAt) {
        this(
                id != null ? id.toString() : null,
                merchantId != null ? merchantId.toString() : null,
                merchantName,
                storeName,
                storeName,
                null,
                address,
                null,
                address,
                cityId,
                null,
                state,
                pincode,
                latitude,
                longitude,
                null,
                "10:00",
                "22:00",
                "Daily (Mon - Sun)",
                java.util.Collections.emptyList(),
                java.util.Collections.emptyList(),
                java.util.Collections.emptyList(),
                status != null ? status.name() : "ACTIVE",
                status != null ? status.name() : "PENDING_APPROVAL",
                null,
                null,
                distanceMeters,
                null,
                createdAt,
                updatedAt,
                BigDecimal.valueOf(5.00), BigDecimal.valueOf(150.00), BigDecimal.valueOf(100.00), true
        );
    }
}
