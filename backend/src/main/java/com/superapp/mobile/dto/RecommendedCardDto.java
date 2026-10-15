package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(description = "Personalized 2-column card for Section 7: Recommended for You")
public record RecommendedCardDto(
        @Schema(description = "Store identifier")
        UUID storeId,

        @Schema(description = "Merchant identifier")
        UUID merchantId,

        @Schema(description = "Active recommended offer identifier")
        UUID offerId,

        @Schema(description = "Store display name", example = "Truffles Burgers")
        String storeName,

        @Schema(description = "Hero card image URL")
        String imageUrl,

        @Schema(description = "AI or heuristic recommendation tag", example = "Based on dining visits")
        String recommendationReasonBadge,

        @Schema(description = "Store customer rating", example = "4.7")
        double rating,

        @Schema(description = "Proximity and cuisine summary", example = "800m • Burgers & Shakes")
        String distanceAndCategoryText,

        @Schema(description = "Distance in meters", example = "800")
        double distanceMeters,

        @Schema(description = "Bonus reward perk headline", example = "+100 Coins on ₹400 bill")
        String perkHighlightText,

        @Schema(description = "Estimated user savings display text", example = "Save ~₹180")
        String estimatedSavingsText,

        @Schema(description = "Estimated amount in rupees", example = "180.0")
        double estimatedSavingsAmount
) {}
