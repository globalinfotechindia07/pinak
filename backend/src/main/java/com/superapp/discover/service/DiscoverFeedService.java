package com.superapp.discover.service;

import com.superapp.discover.dto.DiscoverDtos.*;

import java.util.UUID;

public interface DiscoverFeedService {

    BannersResponse getBanners(String placement, Double latitude, Double longitude);

    ProductDealsResponse getNearbyProductDeals(
            Double latitude, Double longitude, Double radiusKm,
            UUID categoryId, Integer limit, String cursor);

    PopularCollectionsResponse getPopularCollections(
            Double latitude, Double longitude, Double radiusKm, String cityId, Integer limit);

    default PopularCollectionsResponse getPopularCollections(Integer limit) {
        return getPopularCollections(null, null, null, null, limit);
    }

    DiscoverBenefitsResponse getActiveBenefits();

    RecentlyViewedResponse getRecentlyViewed(UUID userId, Integer limit);

    void recordRecentlyViewed(UUID userId, RecordRecentlyViewedRequest request);

    void clearRecentlyViewed(UUID userId);

    void removeRecentlyViewedItem(UUID userId, UUID id);

    RecommendationsResponse getPersonalizedRecommendations(
            UUID userId, Double latitude, Double longitude, Integer limit);
}
