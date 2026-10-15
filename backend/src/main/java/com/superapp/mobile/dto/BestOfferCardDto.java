package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(description = "Individual offer card for Section 5: Best Offers Nearby horizontal scroller")
public record BestOfferCardDto(
        @Schema(description = "Offer identifier")
        UUID offerId,

        @Schema(description = "Store identifier")
        UUID storeId,

        @Schema(description = "Merchant store name", example = "The Smokehouse Grill")
        String merchantName,

        @Schema(description = "Street or area locality", example = "Indiranagar")
        String locality,

        @Schema(description = "Combined locality and distance label", example = "Indiranagar • 400m")
        String distanceText,

        @Schema(description = "Distance in meters", example = "400")
        double distanceMeters,

        @Schema(description = "Urgency badge text", example = "45m left")
        String urgencyTag,

        @Schema(description = "Urgency badge type", example = "EXPIRING_SOON")
        String urgencyType,

        @Schema(description = "Primary discount headline", example = "FLAT 40% OFF")
        String discountHeadline,

        @Schema(description = "Secondary discount condition subtext", example = "Up to ₹500 • On bills above ₹1,000")
        String discountSubtext,

        @Schema(description = "Bonus coins badge text", example = "+150 Coins")
        String bonusCoinsText,

        @Schema(description = "Bonus coins count", example = "150")
        int bonusCoins,

        @Schema(description = "Whether pre-booking or reservation is open", example = "false")
        boolean preBookingOpen,

        @Schema(description = "CTA button label", example = "Lock & Pay")
        String actionButtonText,

        @Schema(description = "Action trigger type", example = "LOCK_AND_PAY")
        String actionType,

        @Schema(description = "Whether offer applies across all branches/stores", example = "false")
        boolean allStoresValid
) {}
