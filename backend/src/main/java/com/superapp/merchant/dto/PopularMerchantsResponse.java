package com.superapp.merchant.dto;

import com.superapp.offer.dto.DiscoverPaginationDto;
import java.util.List;

public record PopularMerchantsResponse(
        List<PopularMerchantItemDto> merchants,
        DiscoverPaginationDto pagination
) {}
