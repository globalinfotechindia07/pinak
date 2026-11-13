package com.superapp.coupon.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class CouponDtos {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CouponItemDto(
            UUID id,
            String code,
            String title,
            String headline,
            String description,
            String badgeText,
            String discountType,
            BigDecimal discountValue,
            BigDecimal maxDiscount,
            BigDecimal minBill,
            String partnerBank,
            String paymentMethodRequired,
            List<String> terms,
            boolean isAutoApplicable,
            boolean isEligible,
            BigDecimal savingsEstimate
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ApplicableCouponsResponse(
            int totalCoupons,
            CouponItemDto autoApplicableCoupon,
            List<CouponItemDto> coupons
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ValidateCouponRequest(
            @NotBlank(message = "Coupon code is required")
            String code,

            @NotNull(message = "Bill amount is required")
            @Positive(message = "Bill amount must be positive")
            BigDecimal billAmount,

            UUID storeId,

            String paymentMethod
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ValidateCouponResponse(
            boolean valid,
            String code,
            String message,
            BigDecimal discountAmount,
            BigDecimal finalPayableAmount,
            CouponItemDto coupon
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AdminCouponDto(
            UUID id,
            String code,
            String title,
            String headline,
            String description,
            String badgeText,
            String discountType,
            BigDecimal discountValue,
            BigDecimal maxDiscount,
            BigDecimal minBillAmount,
            String partnerBank,
            String paymentMethodRequired,
            String terms,
            UUID storeId,
            UUID merchantId,
            UUID categoryId,
            Integer usageLimitTotal,
            Integer usageLimitPerUser,
            Integer currentUsageCount,
            String validFrom,
            String validTo,
            Boolean isActive,
            Boolean isAutoApplicable,
            Integer displayOrder,
            String createdAt,
            String updatedAt
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record SaveCouponRequest(
            @NotBlank(message = "Coupon code is required")
            String code,

            @NotBlank(message = "Title is required")
            String title,

            String headline,
            String description,
            String badgeText,

            @NotBlank(message = "Discount type is required (PERCENTAGE or FLAT)")
            String discountType,

            @NotNull(message = "Discount value is required")
            @Positive(message = "Discount value must be positive")
            BigDecimal discountValue,

            BigDecimal maxDiscount,
            BigDecimal minBillAmount,
            String partnerBank,
            String paymentMethodRequired,
            String terms,
            UUID storeId,
            UUID merchantId,
            UUID categoryId,
            Integer usageLimitTotal,
            Integer usageLimitPerUser,
            String validFrom,
            String validTo,
            Boolean isActive,
            Boolean isAutoApplicable,
            Integer displayOrder
    ) {}
}
