package com.superapp.mobile.dto;

import java.util.List;

public class MasterHomeFeedResponse {

    private HomeHeaderDto header;
    private List<HomeBannerDto> banners;
    private List<HomeCategoryChipDto> categories;
    private BestOffersNearbyResponse bestOffers;
    private PopularMerchantsResponse popularMerchants;
    private RecommendedForYouResponse recommended;
    private NewlyAddedStoresResponse newlyAdded;
    private AllNearbyPlacesResponse nearbyPlaces;

    public MasterHomeFeedResponse() {
    }

    public MasterHomeFeedResponse(HomeHeaderDto header, List<HomeBannerDto> banners,
                                 List<HomeCategoryChipDto> categories,
                                 BestOffersNearbyResponse bestOffers,
                                 PopularMerchantsResponse popularMerchants,
                                 RecommendedForYouResponse recommended,
                                 NewlyAddedStoresResponse newlyAdded,
                                 AllNearbyPlacesResponse nearbyPlaces) {
        this.header = header;
        this.banners = banners;
        this.categories = categories;
        this.bestOffers = bestOffers;
        this.popularMerchants = popularMerchants;
        this.recommended = recommended;
        this.newlyAdded = newlyAdded;
        this.nearbyPlaces = nearbyPlaces;
    }

    public HomeHeaderDto getHeader() {
        return header;
    }

    public void setHeader(HomeHeaderDto header) {
        this.header = header;
    }

    public List<HomeBannerDto> getBanners() {
        return banners;
    }

    public void setBanners(List<HomeBannerDto> banners) {
        this.banners = banners;
    }

    public List<HomeCategoryChipDto> getCategories() {
        return categories;
    }

    public void setCategories(List<HomeCategoryChipDto> categories) {
        this.categories = categories;
    }

    public BestOffersNearbyResponse getBestOffers() {
        return bestOffers;
    }

    public void setBestOffers(BestOffersNearbyResponse bestOffers) {
        this.bestOffers = bestOffers;
    }

    public PopularMerchantsResponse getPopularMerchants() {
        return popularMerchants;
    }

    public void setPopularMerchants(PopularMerchantsResponse popularMerchants) {
        this.popularMerchants = popularMerchants;
    }

    public RecommendedForYouResponse getRecommended() {
        return recommended;
    }

    public void setRecommended(RecommendedForYouResponse recommended) {
        this.recommended = recommended;
    }

    public NewlyAddedStoresResponse getNewlyAdded() {
        return newlyAdded;
    }

    public void setNewlyAdded(NewlyAddedStoresResponse newlyAdded) {
        this.newlyAdded = newlyAdded;
    }

    public AllNearbyPlacesResponse getNearbyPlaces() {
        return nearbyPlaces;
    }

    public void setNearbyPlaces(AllNearbyPlacesResponse nearbyPlaces) {
        this.nearbyPlaces = nearbyPlaces;
    }
}
