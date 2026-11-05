package com.superapp.merchant.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.merchant.dto.FeaturedMerchantsResponse;
import com.superapp.merchant.dto.NewlyAddedMerchantsResponse;
import com.superapp.merchant.dto.PopularMerchantsResponse;
import com.superapp.merchant.service.CustomerMerchantDiscoveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/merchants")
@Tag(name = "Customer Merchant Discovery", description = "Discover screen merchant feeds, popular stores, featured stores, and new stores")
public class CustomerMerchantDiscoveryController {

    private final CustomerMerchantDiscoveryService discoveryService;

    public CustomerMerchantDiscoveryController(CustomerMerchantDiscoveryService discoveryService) {
        this.discoveryService = discoveryService;
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured merchants for Discover screen")
    public ResponseEntity<ApiResponse<FeaturedMerchantsResponse>> getFeaturedMerchants(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String cursor) {

        Double effectiveLat = lat != null ? lat : latitude;
        Double effectiveLng = lng != null ? lng : longitude;

        FeaturedMerchantsResponse response = discoveryService.getFeaturedMerchants(
                effectiveLat, effectiveLng, categoryId, limit, cursor);

        return ResponseEntity.ok(ApiResponse.success("Featured merchants fetched successfully", response));
    }

    @GetMapping("/popular")
    @Operation(summary = "Get nearby popular merchants for Discover screen")
    public ResponseEntity<ApiResponse<PopularMerchantsResponse>> getPopularMerchants(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "10.0") Double radiusKm,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false, defaultValue = "4.0") Double minRating,
            @RequestParam(required = false, defaultValue = "POPULAR") String sort,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String cursor) {

        Double effectiveLat = lat != null ? lat : latitude;
        Double effectiveLng = lng != null ? lng : longitude;

        PopularMerchantsResponse response = discoveryService.getNearbyPopularMerchants(
                effectiveLat, effectiveLng, radiusKm, categoryId, minRating, sort, limit, cursor);

        return ResponseEntity.ok(ApiResponse.success("Popular merchants fetched successfully", response));
    }

    @GetMapping("/newly-added")
    @Operation(summary = "Get newly added merchants for Discover screen")
    public ResponseEntity<ApiResponse<NewlyAddedMerchantsResponse>> getNewlyAddedMerchants(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String cursor) {

        Double effectiveLat = lat != null ? lat : latitude;
        Double effectiveLng = lng != null ? lng : longitude;

        NewlyAddedMerchantsResponse response = discoveryService.getNewlyAddedMerchants(
                effectiveLat, effectiveLng, limit, cursor);

        return ResponseEntity.ok(ApiResponse.success("Newly added merchants fetched successfully", response));
    }
}
