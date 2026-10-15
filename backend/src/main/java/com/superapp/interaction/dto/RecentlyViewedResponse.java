package com.superapp.interaction.dto;

import com.superapp.offer.dto.DiscoverPaginationDto;
import java.util.List;

public record RecentlyViewedResponse(
        List<RecentlyViewedItemDto> items,
        DiscoverPaginationDto pagination
) {}
