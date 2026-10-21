package com.superapp.offer.dto;

import com.superapp.offer.enums.OfferType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminCreateOfferRequest(
        UUID merchantId,
        UUID storeId,

        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title cannot exceed 255 characters")
        String title,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters")
        String description,

        String termsAndConditions,

        @NotNull(message = "Offer type is required")
        OfferType offerType,

        @NotNull(message = "Offer value is required")
        @DecimalMin(value = "0.01", message = "Offer value must be greater than 0")
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
) {}
