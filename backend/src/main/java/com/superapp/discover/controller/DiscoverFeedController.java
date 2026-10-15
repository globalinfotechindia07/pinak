package com.superapp.discover.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.discover.dto.DiscoverDtos.*;
import com.superapp.discover.service.DiscoverFeedService;
import com.superapp.user.entity.User;
import com.superapp.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Discover Screen Feed", description = "Consolidated, production-grade endpoints powering the PINAK Deals Discovery App (Screen 10)")
public class DiscoverFeedController {

    private final DiscoverFeedService discoverService;
    private final UserRepository userRepository;

    public DiscoverFeedController(DiscoverFeedService discoverService, UserRepository userRepository) {
        this.discoverService = discoverService;
        this.userRepository = userRepository;
    }

    // ==========================================
    // Section 03: Hero Promotional Banners
    // ==========================================
    @GetMapping("/banners")
    @Operation(summary = "Get promotional banners for Discover screen", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BannersResponse>> getBanners(
            @RequestParam(required = false, defaultValue = "DISCOVER") String placement,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {

        BannersResponse response = discoverService.getBanners(placement, latitude, longitude);
        return ResponseEntity.ok(ApiResponse.success("Banners fetched successfully", response));
    }

    // ==========================================
    // Section 06: Top Product Deals Near You
    // ==========================================
    @GetMapping("/products/deals/nearby")
    @Operation(summary = "Get nearby retail product bargains and daily essentials", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProductDealsResponse>> getNearbyProductDeals(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false, defaultValue = "5.0") Double radiusKm,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String cursor) {

        ProductDealsResponse response = discoverService.getNearbyProductDeals(
                latitude, longitude, radiusKm, categoryId, limit, cursor);
        return ResponseEntity.ok(ApiResponse.success("Product deals fetched successfully", response));
    }

    // ==========================================
    // Section 08: Popular Curated Collections
    // ==========================================
    @GetMapping("/collections/popular")
    @Operation(summary = "Get popular curated discovery collections", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PopularCollectionsResponse>> getPopularCollections(
            @RequestParam(required = false, defaultValue = "10") Integer limit) {

        PopularCollectionsResponse response = discoverService.getPopularCollections(limit);
        return ResponseEntity.ok(ApiResponse.success("Popular collections fetched successfully", response));
    }

    // ==========================================
    // Section 09: User Recently Viewed Items
    // ==========================================
    @GetMapping("/users/me/recently-viewed")
    @Operation(summary = "Get authenticated user's recently viewed items", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RecentlyViewedResponse>> getRecentlyViewed(
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            Authentication authentication) {

        UUID userId = resolveUserId(authentication);
        RecentlyViewedResponse response = discoverService.getRecentlyViewed(userId, limit);
        return ResponseEntity.ok(ApiResponse.success("Recently viewed items fetched successfully", response));
    }

    @PostMapping("/users/me/recently-viewed")
    @Operation(summary = "Record user item view event", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> recordRecentlyViewed(
            @RequestBody RecordRecentlyViewedRequest request,
            Authentication authentication) {

        UUID userId = resolveUserId(authentication);
        discoverService.recordRecentlyViewed(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Item view recorded successfully", "OK"));
    }

    // ==========================================
    // Section 10: Personalized Recommendations
    // ==========================================
    @GetMapping("/recommendations")
    @Operation(summary = "Get personalized recommendations based on interests and visits", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RecommendationsResponse>> getRecommendations(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            Authentication authentication) {

        UUID userId = resolveUserId(authentication);
        RecommendationsResponse response = discoverService.getPersonalizedRecommendations(
                userId, latitude, longitude, limit);
        return ResponseEntity.ok(ApiResponse.success("Recommendations fetched successfully", response));
    }

    // ==========================================
    // Section 12: Platform Trust Badges ("Why Shop on PINAK?")
    // ==========================================
    @GetMapping("/discover/benefits")
    @Operation(summary = "Get platform value propositions and trust guarantees", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DiscoverBenefitsResponse>> getBenefits() {
        DiscoverBenefitsResponse response = discoverService.getActiveBenefits();
        return ResponseEntity.ok(ApiResponse.success("Platform benefits fetched successfully", response));
    }

    private UUID resolveUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return UUID.fromString("00000000-0000-0000-0000-000000000003");
        }
        return userRepository.findByEmail(authentication.getName())
                .map(User::getId)
                .orElse(UUID.fromString("00000000-0000-0000-0000-000000000003"));
    }
}
