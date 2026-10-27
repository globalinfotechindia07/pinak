package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.superapp.common.converter.FlexibleInstantDeserializer;
import com.superapp.common.converter.FlexibleUuidDeserializer;
import com.superapp.offer.enums.OfferType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UpdateOfferRequest(
        @JsonDeserialize(using = FlexibleUuidDeserializer.class)
        UUID storeId,

        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title cannot exceed 255 characters")
        String title,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters")
        @JsonAlias({"tagline", "terms", "termsAndConditions"})
        String description,

        @NotNull(message = "Offer type is required")
        @JsonProperty("offerType")
        @JsonAlias({"type", "offer_type"})
        OfferType offerType,

        @NotNull(message = "Offer value is required")
        @DecimalMin(value = "0.01", message = "Offer value must be greater than 0")
        BigDecimal value,

        @DecimalMin(value = "0.00", message = "Minimum transaction amount cannot be negative")
        @JsonAlias({"minBillAmount", "min_transaction_amount"})
        BigDecimal minTransactionAmount,

        @DecimalMin(value = "0.00", message = "Maximum discount amount cannot be negative")
        @JsonAlias({"maxDiscount", "max_discount_amount"})
        BigDecimal maxDiscountAmount,

        @JsonAlias({"maxTotalRedemptions", "usage_limit"})
        Integer usageLimit,

        @JsonAlias({"perUserLimit", "per_customer_limit"})
        Integer perCustomerLimit,

        @NotNull(message = "validFrom is required")
        @JsonDeserialize(using = FlexibleInstantDeserializer.class)
        Instant validFrom,

        @NotNull(message = "validTo is required")
        @JsonDeserialize(using = FlexibleInstantDeserializer.class)
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
        Integer minAdvanceHours,
        @JsonAlias({"buy_quantity", "buyQty"})
        Integer buyQuantity,
        @JsonAlias({"get_quantity", "getQty"})
        Integer getQuantity,
        @JsonAlias({"is_table_booking_enabled", "tableBookingEnabled"})
        Boolean isTableBookingEnabled,
        @JsonAlias({"booking_type"})
        String bookingType,
        @JsonAlias({"min_party_size"})
        Integer minPartySize,
        @JsonAlias({"max_party_size"})
        Integer maxPartySize,
        @JsonAlias({"available_tables_per_slot"})
        Integer availableTablesPerSlot,
        @JsonAlias({"cover_charge_amount", "coverCharge"})
        BigDecimal coverChargeAmount,
        @JsonAlias({"grace_period_minutes", "gracePeriod"})
        Integer gracePeriodMinutes,
        @JsonAlias({"slot_times"})
        Object slotTimes,
        @JsonAlias({"seating_areas"})
        Object seatingAreas,
        @JsonAlias({"active_days"})
        Object activeDays,
        @JsonAlias({"start_time", "happyHoursStart"})
        String startTime,
        @JsonAlias({"end_time", "happyHoursEnd"})
        String endTime
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
             "BOTH", 0, 1, 1, false, null, 1, 6, 5, BigDecimal.ZERO, 15, null, null, null, null, null);
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
             "SERVICE", null, null, false, 50, 100, null, null, "Book & Pay", "BOTH", 0, 1, 1, false, null, 1, 6, 5, BigDecimal.ZERO, 15, null, null, null, null, null);
    }
}
