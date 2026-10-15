package com.superapp.merchant.dto;

import com.superapp.offer.dto.DiscoverPaginationDto;
import java.util.List;

public record FeaturedMerchantsResponse(
        List<FeaturedMerchantItemDto> merchants,
        DiscoverPaginationDto pagination
) {}
