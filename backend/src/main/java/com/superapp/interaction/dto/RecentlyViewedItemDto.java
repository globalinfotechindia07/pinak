package com.superapp.interaction.dto;

import com.superapp.offer.dto.DiscoverPaginationDto;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record RecentlyViewedItemDto(
        String itemType, // 'PRODUCT' or 'MERCHANT'
        String itemId,
        Instant viewedAt,
        String name,
        String imageUrl,
        String unit,
        PriceDto price,
        AvailabilityDto availability,
        String categoryName
) {
    public record PriceDto(
            String currency,
            BigDecimal sellingPrice,
            BigDecimal mrp
    ) {}

    public record AvailabilityDto(
            boolean inStock
    ) {}
}
