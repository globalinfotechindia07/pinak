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

    @GetMapping("/nearby")
    @Operation(summary = "Get popular nearby merchants", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PopularMerchantsResponse>> getNearbyMerchants(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false, defaultValue = "POPULAR") String sort,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String cursor) {

        PopularMerchantsResponse response = discoveryService.getNearbyPopularMerchants(
                latitude, longitude, radiusKm, categoryId, minRating, sort, limit, cursor);

        return ResponseEntity.ok(ApiResponse.success("Popular nearby merchants fetched successfully", response));
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured merchants for Discover screen", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FeaturedMerchantsResponse>> getFeaturedMerchants(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String cursor) {

        FeaturedMerchantsResponse response = discoveryService.getFeaturedMerchants(
                latitude, longitude, categoryId, limit, cursor);

        return ResponseEntity.ok(ApiResponse.success("Featured merchants fetched successfully", response));
    }

    @GetMapping("/newly-added")
    @Operation(summary = "Get newly added stores for Discover screen", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NewlyAddedMerchantsResponse>> getNewlyAddedMerchants(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String cursor) {

        NewlyAddedMerchantsResponse response = discoveryService.getNewlyAddedMerchants(
                latitude, longitude, limit, cursor);

        return ResponseEntity.ok(ApiResponse.success("Newly added stores fetched successfully", response));
    }
}
