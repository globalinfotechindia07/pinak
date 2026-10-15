package com.superapp.merchant.service;

import com.superapp.merchant.dto.FeaturedMerchantsResponse;
import com.superapp.merchant.dto.NewlyAddedMerchantsResponse;
import com.superapp.merchant.dto.PopularMerchantsResponse;
import java.util.UUID;

public interface CustomerMerchantDiscoveryService {

    PopularMerchantsResponse getNearbyPopularMerchants(
            Double latitude,
            Double longitude,
            Double radiusKm,
            UUID categoryId,
            Double minRating,
            String sort,
            Integer limit,
            String cursor
    );

    FeaturedMerchantsResponse getFeaturedMerchants(
            Double latitude,
            Double longitude,
            UUID categoryId,
            Integer limit,
            String cursor
    );

    NewlyAddedMerchantsResponse getNewlyAddedMerchants(
            Double latitude,
            Double longitude,
            Integer limit,
            String cursor
    );
}
