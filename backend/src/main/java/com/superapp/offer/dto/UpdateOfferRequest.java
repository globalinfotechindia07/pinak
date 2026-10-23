package com.superapp.offer.dto;

import com.superapp.offer.enums.OfferType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record UpdateOfferRequest(
        UUID storeId,

        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title cannot exceed 255 characters")
        String title,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters")
        String description,

        @NotNull(message = "Offer type is required")
        OfferType offerType,

        @NotNull(message = "Offer value is required")
        @DecimalMin(value = "0.01", message = "Offer value must be greater than 0")
        BigDecimal value,

        @DecimalMin(value = "0.00", message = "Minimum transaction amount cannot be negative")
        BigDecimal minTransactionAmount,

        @DecimalMin(value = "0.00", message = "Maximum discount amount cannot be negative")
        BigDecimal maxDiscountAmount,

        Integer usageLimit,

        Integer perCustomerLimit,

        @NotNull(message = "validFrom is required")
        Instant validFrom,

        @NotNull(message = "validTo is required")
        Instant validTo,

        // Rich Fields for Mobile App Screen 10:
        String offerScope,
        BigDecimal originalMrp,
        BigDecimal flashSellingPrice,
        Boolean isFlash,
        Integer remainingQuantity,
        Integer bonusCoins,
        String imageUrl,
        String badgeText,
        String ctaText,
        String redemptionType,
        Integer minAdvanceHours
) {
    // 20-argument backwards-compatible constructor
    public UpdateOfferRequest(
            UUID storeId,
            String title,
            String description,
            OfferType offerType,
            BigDecimal value,
            BigDecimal minTransactionAmount,
            BigDecimal maxDiscountAmount,
            Integer usageLimit,
            Integer perCustomerLimit,
            Instant validFrom,
            Instant validTo,
            String offerScope,
            BigDecimal originalMrp,
            BigDecimal flashSellingPrice,
            Boolean isFlash,
            Integer remainingQuantity,
            Integer bonusCoins,
            String imageUrl,
            String badgeText,
            String ctaText
    ) {
        this(storeId, title, description, offerType, value, minTransactionAmount, maxDiscountAmount,
             usageLimit, perCustomerLimit, validFrom, validTo,
             offerScope, originalMrp, flashSellingPrice, isFlash, remainingQuantity, bonusCoins, imageUrl, badgeText, ctaText,
             "BOTH", 0);
    }

    // 11-argument backwards-compatible constructor for existing test suites
    public UpdateOfferRequest(
            UUID storeId,
            String title,
            String description,
            OfferType offerType,
            BigDecimal value,
            BigDecimal minTransactionAmount,
            BigDecimal maxDiscountAmount,
            Integer usageLimit,
            Integer perCustomerLimit,
            Instant validFrom,
            Instant validTo
    ) {
        this(storeId, title, description, offerType, value, minTransactionAmount, maxDiscountAmount,
             usageLimit, perCustomerLimit, validFrom, validTo,
             "SERVICE", null, null, false, 50, 100, null, null, "Book & Pay", "BOTH", 0);
    }
}
