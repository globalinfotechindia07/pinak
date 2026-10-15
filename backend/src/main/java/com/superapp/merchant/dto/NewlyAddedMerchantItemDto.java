package com.superapp.merchant.dto;

import com.superapp.offer.dto.DiscoverPaginationDto;
import java.time.Instant;
import java.util.List;

public record NewlyAddedMerchantItemDto(
        String merchantId,
        String name,
        String coverImageUrl,
        String categoryName,
        Integer distanceMeters,
        boolean isVerified,
        Instant joinedAt,
        Instant newUntil,
        PopularMerchantItemDto.BestOfferSummaryDto introductoryOffer
) {}
