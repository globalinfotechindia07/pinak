package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Section 7: Recommended for You Response")
public record RecommendedForYouResponse(
        @Schema(description = "Section header title", example = "Recommended for You")
        String title,

        @Schema(description = "Section descriptive subtitle", example = "Personalized picks based on your visits, favorite offers & popularity")
        String subtitle,

        @Schema(description = "Icon symbol key", example = "auto_awesome")
        String recommendationIcon,

        @Schema(description = "Personalized recommendation cards in 2-column format")
        List<RecommendedCardDto> recommendations
) {}
