package com.superapp.merchant.dto;

import com.superapp.offer.dto.DiscoverPaginationDto;
import java.util.List;

public record NewlyAddedMerchantsResponse(
        List<NewlyAddedMerchantItemDto> merchants,
        DiscoverPaginationDto pagination
) {}
