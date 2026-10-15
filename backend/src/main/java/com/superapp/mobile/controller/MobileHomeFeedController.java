package com.superapp.mobile.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.mobile.dto.*;
import com.superapp.mobile.service.MobileHomeFeedService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/mobile/home")
@Tag(name = "Mobile App - Screen 10 Home Feed", description = "Composable sections for the PINAK Mobile Home/Discover Feed")
public class MobileHomeFeedController {

    private final MobileHomeFeedService homeFeedService;

    public MobileHomeFeedController(MobileHomeFeedService homeFeedService) {
        this.homeFeedService = homeFeedService;
    }

    @GetMapping("/header")
    @Operation(summary = "Fetch Section 1 & 2: Top App Bar & Search", description = "Returns active precinct address, live wallet balance (points & ₹ value), unread notification badge count, and search query suggestions")
    public ResponseEntity<ApiResponse<HomeHeaderDto>> getHomeHeader(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng,
            Authentication authentication
    ) {
        UUID userId = resolveUserId(authentication);
        HomeHeaderDto response = homeFeedService.getHomeHeader(userId, lat, lng);
        return ResponseEntity.ok(ApiResponse.success("Home header fetched successfully", response));
    }

    @GetMapping("/banners")
    @Operation(summary = "Fetch Section 3: Promotional Hero Banners", description = "Returns dynamic hero carousel banners stored in the database with action links, deep link routes, badges, and gradient themes")
    public ResponseEntity<ApiResponse<List<HomeBannerDto>>> getHeroBanners() {
        List<HomeBannerDto> response = homeFeedService.getHeroBanners();
        return ResponseEntity.ok(ApiResponse.success("Hero banners fetched successfully", response));
    }

    @GetMapping("/categories")
    @Operation(summary = "Fetch Section 4: Explore Categories Grid", description = "Returns category chips/cards with icons, display names, available store counts, and filter tags")
    public ResponseEntity<ApiResponse<List<HomeCategoryChipDto>>> getCategoryChips(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng
    ) {
        List<HomeCategoryChipDto> response = homeFeedService.getCategoryChips(lat, lng);
        return ResponseEntity.ok(ApiResponse.success("Category chips fetched successfully", response));
    }

    @GetMapping("/best-offers")
    @Operation(summary = "Fetch Section 5: Best Offers Nearby", description = "Returns horizontal scroller offers sorted by proximity and highest discount (e.g. Smokehouse Grill 40% OFF, Toni & Guy BOGO, Third Wave Coffee ₹150 Cashback)")
    public ResponseEntity<ApiResponse<BestOffersNearbyResponse>> getBestOffersNearby(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng,
            @RequestParam(value = "radius", required = false, defaultValue = "5000") Double radius,
            @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit
    ) {
        BestOffersNearbyResponse response = homeFeedService.getBestOffersNearby(lat, lng, radius, limit);
        return ResponseEntity.ok(ApiResponse.success("Best offers nearby fetched successfully", response));
    }

    @GetMapping("/popular-merchants")
    @Operation(summary = "Fetch Section 6: Popular Near You", description = "Returns top-rated verified merchant places within 2 km (e.g. Toscano Trattoria 4.8★, Cult.Fit Pro 4.9★, Glen's Bakehouse 4.7★)")
    public ResponseEntity<ApiResponse<PopularMerchantsResponse>> getPopularMerchants(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng,
            @RequestParam(value = "radius", required = false, defaultValue = "2000") Double radius,
            @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit
    ) {
        PopularMerchantsResponse response = homeFeedService.getPopularMerchants(lat, lng, radius, limit);
        return ResponseEntity.ok(ApiResponse.success("Popular merchants fetched successfully", response));
    }

    @GetMapping("/recommended")
    @Operation(summary = "Fetch Section 7: Recommended for You", description = "Returns personalized 2-column recommendation cards based on user visits, popularity & savings (e.g. Truffles Burgers 'Save ~₹180', Bodycraft Spa 'Save ~₹600')")
    public ResponseEntity<ApiResponse<RecommendedForYouResponse>> getRecommendedForYou(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng,
            @RequestParam(value = "limit", required = false, defaultValue = "4") Integer limit,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        RecommendedForYouResponse response = homeFeedService.getRecommendedForYou(lat, lng, authHeader, limit);
        return ResponseEntity.ok(ApiResponse.success("Recommended places fetched successfully", response));
    }

    @GetMapping("/newly-added")
    @Operation(summary = "Fetch Section 8: Newly Added Stores", description = "Returns newly onboarded partner stores with grand opening offers and bonus coins (e.g. Blue Tokai 'Free Cookie with Beverage', Go Native '20% Cashback', Superkicks '300 PINAK Coins')")
    public ResponseEntity<ApiResponse<NewlyAddedStoresResponse>> getNewlyAddedStores(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng,
            @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit
    ) {
        NewlyAddedStoresResponse response = homeFeedService.getNewlyAddedStores(lat, lng, limit);
        return ResponseEntity.ok(ApiResponse.success("Newly added stores fetched successfully", response));
    }

    @GetMapping("/all-places")
    @Operation(summary = "Fetch Section 9: All Nearby Places", description = "Returns paginated list of all nearby places with sort filters (NEAREST, RATING_4_PLUS, MAX_DISCOUNT, OPEN_NOW) with ratings, distances and Pay & Save action")
    public ResponseEntity<ApiResponse<AllNearbyPlacesResponse>> getAllNearbyPlaces(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng,
            @RequestParam(value = "radius", required = false, defaultValue = "10000") Double radius,
            @RequestParam(value = "filter", required = false, defaultValue = "NEAREST") String filter,
            @RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
            @RequestParam(value = "size", required = false, defaultValue = "10") Integer size
    ) {
        AllNearbyPlacesResponse response = homeFeedService.getAllNearbyPlaces(lat, lng, radius, filter, page, size);
        return ResponseEntity.ok(ApiResponse.success("All nearby places fetched successfully", response));
    }

    @GetMapping("/feed")
    @Operation(summary = "Fetch Complete Composable Master Home Feed", description = "Returns all 9 sections in a single high-performance composable payload for lightning fast mobile app cold start")
    public ResponseEntity<ApiResponse<MasterHomeFeedResponse>> getMasterHomeFeed(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng,
            Authentication authentication
    ) {
        UUID userId = resolveUserId(authentication);
        MasterHomeFeedResponse response = homeFeedService.getMasterHomeFeed(userId, lat, lng);
        return ResponseEntity.ok(ApiResponse.success("Master home feed fetched successfully", response));
    }

    private UUID resolveUserId(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
            try {
                return UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException ignored) {
                return null;
            }
        }
        return null;
    }
}
