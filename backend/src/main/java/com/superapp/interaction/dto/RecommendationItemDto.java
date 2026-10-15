package com.superapp.interaction.dto;

import com.superapp.merchant.dto.PopularMerchantItemDto;
import com.superapp.offer.dto.DiscoverPaginationDto;
import java.util.List;

public record RecommendationItemDto(
        String itemType, // 'MERCHANT' or 'PRODUCT'
        String itemId,
        String name,
        String categoryName,
        String coverImageUrl,
        Integer distanceMeters,
        PopularMerchantItemDto.RatingSummaryDto rating,
        String recommendationReason, // 'BASED_ON_INTERESTS', 'POPULAR_IN_YOUR_AREA'
        String reasonLabel,
        PopularMerchantItemDto.BestOfferSummaryDto bestOffer
) {}
