package com.superapp.mobile.service;

import com.superapp.mobile.dto.BestOffersNearbyResponse;

public interface MobileHomeFeedService {

    /**
     * Section 5: Best Offers Nearby horizontal scroller feed
     */
    BestOffersNearbyResponse getBestOffersNearby(Double latitude, Double longitude, Double radius, Integer limit);

    /**
     * Section 6: Popular Near You high-footfall verified merchants
     */
    com.superapp.mobile.dto.PopularMerchantsResponse getPopularMerchants(Double latitude, Double longitude, Double radius, Integer limit);

    /**
     * Section 7: Recommended for You personalized picks (2-column grid)
     */
    com.superapp.mobile.dto.RecommendedForYouResponse getRecommendedForYou(Double latitude, Double longitude, String authHeader, Integer limit);

    /**
     * Section 8: Newly Added Stores (Just Onboarded)
     */
    com.superapp.mobile.dto.NewlyAddedStoresResponse getNewlyAddedStores(Double latitude, Double longitude, Integer limit);

    /**
     * Section 9: All Nearby Places paginated list with dynamic sort & filters
     * (NEAREST, RATING_4_PLUS, MAX_DISCOUNT, OPEN_NOW)
     */
    com.superapp.mobile.dto.AllNearbyPlacesResponse getAllNearbyPlaces(
            Double latitude, Double longitude, Double radius, String filter, Integer page, Integer size);

    /**
     * Section 1 & 2: Home Header with user balance, precinct, unread notifications & search config
     */
    com.superapp.mobile.dto.HomeHeaderDto getHomeHeader(java.util.UUID userId, Double latitude, Double longitude);

    /**
     * Section 3: Promotional Hero Banners Carousel from database
     */
    java.util.List<com.superapp.mobile.dto.HomeBannerDto> getHeroBanners();

    /**
     * Section 4: Explore Categories Grid with store counts & auto-applied filter tags
     */
    java.util.List<com.superapp.mobile.dto.HomeCategoryChipDto> getCategoryChips(Double latitude, Double longitude);

    /**
     * Master Aggregated Feed: Single high-performance call combining all sections
     */
    com.superapp.mobile.dto.MasterHomeFeedResponse getMasterHomeFeed(java.util.UUID userId, Double latitude, Double longitude);
}
