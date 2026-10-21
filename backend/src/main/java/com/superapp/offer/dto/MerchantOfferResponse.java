package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MerchantOfferResponse(
        String id,
        String storeId,
        String storeName,
        String merchantId,
        String categoryId,
        String title,
        String description,
        String offerType,
        BigDecimal value,
        BigDecimal minTransactionAmount,
        BigDecimal maxDiscountAmount,
        Integer usageLimit,
        Integer perCustomerLimit,
        Instant validFrom,
        Instant validTo,
        String status,
        String approvalStatus,
        String rejectionReason,
        Instant approvedAt,
        Instant createdAt,
        Instant updatedAt,

        // Rich Fields for Mobile App Screen 10:
        String offerScope,
        BigDecimal originalMrp,
        BigDecimal flashSellingPrice,
        Boolean isFlash,
        Integer remainingQuantity,
        Integer bonusCoins,
        String imageUrl,
        String badgeText,
        String ctaText
) implements Serializable {

    // 21-argument backwards-compatible constructor for existing tests
    public MerchantOfferResponse(
            String id,
            String storeId,
            String storeName,
            String merchantId,
            String categoryId,
            String title,
            String description,
            String offerType,
            BigDecimal value,
            BigDecimal minTransactionAmount,
            BigDecimal maxDiscountAmount,
            Integer usageLimit,
            Integer perCustomerLimit,
            Instant validFrom,
            Instant validTo,
            String status,
            String approvalStatus,
            String rejectionReason,
            Instant approvedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        this(id, storeId, storeName, merchantId, categoryId, title, description, offerType, value,
             minTransactionAmount, maxDiscountAmount, usageLimit, perCustomerLimit, validFrom, validTo,
             status, approvalStatus, rejectionReason, approvedAt, createdAt, updatedAt,
             "SERVICE", null, null, false, 50, 100, null, null, "Book & Pay");
    }
}
