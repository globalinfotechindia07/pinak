package com.superapp.discover.service;

import com.superapp.discover.dto.DiscoverDtos.*;

import java.util.UUID;

public interface DiscoverFeedService {

    BannersResponse getBanners(String placement, Double latitude, Double longitude);

    ProductDealsResponse getNearbyProductDeals(
            Double latitude, Double longitude, Double radiusKm,
            UUID categoryId, Integer limit, String cursor);

    PopularCollectionsResponse getPopularCollections(Integer limit);

    DiscoverBenefitsResponse getActiveBenefits();

    RecentlyViewedResponse getRecentlyViewed(UUID userId, Integer limit);

    void recordRecentlyViewed(UUID userId, RecordRecentlyViewedRequest request);

    RecommendationsResponse getPersonalizedRecommendations(
            UUID userId, Double latitude, Double longitude, Integer limit);
}
