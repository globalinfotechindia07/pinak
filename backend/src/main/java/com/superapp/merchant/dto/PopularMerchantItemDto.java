package com.superapp.merchant.dto;

import com.superapp.offer.dto.DiscoverPaginationDto;
import java.math.BigDecimal;
import java.util.List;

public record PopularMerchantItemDto(
        String merchantId,
        String name,
        String logoUrl,
        String coverImageUrl,
        CategorySummaryDto category,
        RatingSummaryDto rating,
        Integer distanceMeters,
        boolean isVerified,
        boolean isOpenNow,
        BestOfferSummaryDto bestOffer,
        BranchSummaryDto branch,
        boolean isFavorite
) {
    public record CategorySummaryDto(
            String categoryId,
            String name
    ) {}

    public record RatingSummaryDto(
            BigDecimal average,
            Integer count
    ) {}

    public record BestOfferSummaryDto(
            String offerId,
            String label
    ) {}

    public record BranchSummaryDto(
            String branchId,
            String name
    ) {}
}
