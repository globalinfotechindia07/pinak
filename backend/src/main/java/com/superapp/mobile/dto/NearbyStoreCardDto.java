package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(description = "Sneak peek store card for radar preview")
public record NearbyStoreCardDto(
        @Schema(description = "Store identifier")
        UUID storeId,

        @Schema(description = "Store display name", example = "Brew & Bites Cafe")
        String storeName,

        @Schema(description = "Calculated distance display text", example = "120m away")
        String distanceText,

        @Schema(description = "Whether the store has live soundbox payment terminal", example = "true")
        boolean hasSoundbox,

        @Schema(description = "Top discount offer highlight", example = "30% OFF")
        String activeDiscountText,

        @Schema(description = "Store customer rating", example = "4.8")
        double rating
) {}
