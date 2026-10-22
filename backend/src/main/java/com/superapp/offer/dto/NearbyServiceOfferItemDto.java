package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.Instant;

@Schema(description = "Service offer deal item with merchant and branch details")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record NearbyServiceOfferItemDto(
        @Schema(description = "Offer ID", example = "c0000000-0000-0000-0000-000000000001")
        String offerId,

        @Schema(description = "Offer primary headline", example = "Flat 40% Off")
        String title,

        @Schema(description = "Offer condition subtitle", example = "On bills above ₹1,000")
        String subtitle,

        @Schema(description = "Offer discount type", example = "PERCENTAGE_DISCOUNT")
        String offerType,

        @Schema(description = "Discount percentage or fixed value", example = "40.00")
        BigDecimal discountValue,

        @Schema(description = "Maximum cap on discount amount", example = "500.00")
        BigDecimal maxDiscountAmount,

        @Schema(description = "Minimum bill value required to qualify", example = "1000.00")
        BigDecimal minimumOrderAmount,

        @Schema(description = "Merchant brand summary")
        MerchantSummaryDto merchant,

        @Schema(description = "Nearby store branch summary")
        BranchSummaryDto branch,

        @Schema(description = "Banner cover image URL")
        String imageUrl,

        @Schema(description = "Expiration timestamp")
        Instant expiresAt,

        @Schema(description = "Reward perk earned")
        RewardSummaryDto reward,

        @Schema(description = "Action button text", example = "Book & Pay")
        String ctaText,

        @Schema(description = "Customer eligibility validation status", example = "CHECK_REQUIRED")
        String eligibilityStatus,

        @Schema(description = "Offer scope (SERVICE or PRODUCT)", example = "PRODUCT")
        String offerScope,

        @Schema(description = "Original MRP for product item deals", example = "65.00")
        BigDecimal originalMrp,

        @Schema(description = "Store deal selling price for product item deals", example = "52.00")
        BigDecimal flashSellingPrice,

        @Schema(description = "Whether deal is a flash sale with stock countdown")
        Boolean isFlash,

        @Schema(description = "Remaining flash units stock")
        Integer remainingQuantity,

        @Schema(description = "Deal badge text", example = "20% OFF")
        String badgeText
) {
    public NearbyServiceOfferItemDto(
            String offerId,
            String title,
            String subtitle,
            String offerType,
            BigDecimal discountValue,
            BigDecimal maxDiscountAmount,
            BigDecimal minimumOrderAmount,
            MerchantSummaryDto merchant,
            BranchSummaryDto branch,
            String imageUrl,
            Instant expiresAt,
            RewardSummaryDto reward,
            String ctaText,
            String eligibilityStatus
    ) {
        this(offerId, title, subtitle, offerType, discountValue, maxDiscountAmount, minimumOrderAmount,
             merchant, branch, imageUrl, expiresAt, reward, ctaText, eligibilityStatus,
             "SERVICE", null, null, false, null, null);
    }
    public record MerchantSummaryDto(
            String merchantId,
            String name,
            String logoUrl,
            Boolean isVerified
    ) {}

    public record BranchSummaryDto(
            String branchId,
            String name,
            Integer distanceMeters
    ) {}

    public record RewardSummaryDto(
            Integer coins,
            String label
    ) {}
}
