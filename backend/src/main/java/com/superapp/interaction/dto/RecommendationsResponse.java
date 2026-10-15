package com.superapp.interaction.dto;

import com.superapp.offer.dto.DiscoverPaginationDto;
import java.util.List;

public record RecommendationsResponse(
        List<RecommendationItemDto> items,
        DiscoverPaginationDto pagination
) {}
