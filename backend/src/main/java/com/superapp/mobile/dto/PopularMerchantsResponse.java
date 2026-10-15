package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Section 6: Popular Near You Feed Response")
public record PopularMerchantsResponse(
        @Schema(description = "Section title", example = "Popular Near You")
        String title,

        @Schema(description = "Section descriptive subtitle", example = "Top-rated spots trending in your precinct")
        String subtitle,

        @Schema(description = "Active distance filter label", example = "< 2 km")
        String distanceFilterLabel,

        @Schema(description = "List of top-rated popular merchant places nearby")
        List<PopularMerchantCardDto> merchants
) {}
