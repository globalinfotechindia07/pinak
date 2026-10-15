package com.superapp.search.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Search suggestion item representing a store, category, or offer")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SearchSuggestionItemDto(
        @Schema(description = "Suggestion type: MERCHANT, CATEGORY, OFFER, or PRODUCT", example = "MERCHANT")
        String type,

        @Schema(description = "Resource ID", example = "b0000000-0000-0000-0000-000000000001")
        String id,

        @Schema(description = "Primary display title", example = "The Smokehouse Grill")
        String title,

        @Schema(description = "Subtitle or context descriptor", example = "Barbecue & Grill • 400 m away")
        String subtitle,

        @Schema(description = "Representative image URL", example = "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80")
        String imageUrl
) {
}
