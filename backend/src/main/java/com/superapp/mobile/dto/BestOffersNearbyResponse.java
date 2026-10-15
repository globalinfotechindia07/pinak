package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Section 5: Best Offers Nearby Feed Response")
public record BestOffersNearbyResponse(
        @Schema(description = "Section header title", example = "Best Offers Nearby")
        String title,

        @Schema(description = "Section header descriptive subtitle", example = "Highest discounts & verified partner savings around you")
        String subtitle,

        @Schema(description = "Total number of available offers in radius", example = "28")
        long totalOffersCount,

        @Schema(description = "View All button label", example = "View All (28)")
        String viewAllText,

        @Schema(description = "List of best offer cards sorted by highest value and proximity")
        List<BestOfferCardDto> offers
) {}
