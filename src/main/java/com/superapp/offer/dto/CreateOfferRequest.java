package com.superapp.offer.dto;

import com.superapp.offer.enums.OfferType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CreateOfferRequest(
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
        Instant validTo
) {}
