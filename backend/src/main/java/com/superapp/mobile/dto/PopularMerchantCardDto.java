package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(description = "Merchant card for Section 6: Popular Near You")
public record PopularMerchantCardDto(
        @Schema(description = "Store identifier")
        UUID storeId,

        @Schema(description = "Merchant account identifier")
        UUID merchantId,

        @Schema(description = "Merchant store display name", example = "Toscano Trattoria")
        String storeName,

        @Schema(description = "Thumbnail image URL")
        String imageUrl,

        @Schema(description = "Whether the merchant is Pinak verified partner", example = "true")
        boolean isVerified,

        @Schema(description = "Aggregated customer rating", example = "4.8")
        double rating,

        @Schema(description = "Total reviews display count", example = "1.4k")
        String reviewCountText,

        @Schema(description = "Cuisine or business category tag", example = "Italian & Wine")
        String cuisineOrCategory,

        @Schema(description = "Distance display text", example = "600m")
        String distanceText,

        @Schema(description = "Distance in meters", example = "600")
        double distanceMeters,

        @Schema(description = "Live store opening status text", example = "OPEN NOW (Closes 11 PM)")
        String operatingStatusText,

        @Schema(description = "Whether store is currently open", example = "true")
        boolean isOpen,

        @Schema(description = "Top deal or discount pill highlight", example = "15% Instant Off")
        String badgeHighlightText,

        @Schema(description = "Badge color theme token", example = "SECONDARY")
        String badgeTheme
) {}
