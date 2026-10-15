package com.superapp.merchant.dto;

import com.superapp.offer.dto.DiscoverPaginationDto;
import java.math.BigDecimal;
import java.util.List;

public record FeaturedMerchantItemDto(
        String merchantId,
        String name,
        String logoUrl,
        String coverImageUrl,
        String categoryName,
        PopularMerchantItemDto.RatingSummaryDto rating,
        Integer distanceMeters,
        String featuredLabel,
        PopularMerchantItemDto.BestOfferSummaryDto bestOffer,
        boolean isVerified
) {}
