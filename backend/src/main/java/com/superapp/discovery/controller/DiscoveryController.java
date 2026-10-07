package com.superapp.discovery.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.discovery.dto.*;
import com.superapp.discovery.service.DiscoveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/discovery")
@Tag(name = "Customer Discovery", description = "Public store discovery, search, PostGIS location search, and offers")
public class DiscoveryController {

    private final DiscoveryService discoveryService;

    public DiscoveryController(DiscoveryService discoveryService) {
        this.discoveryService = discoveryService;
    }

    @GetMapping("/nearby")
    @Operation(summary = "Find nearby stores by PostGIS spherical distance",
            description = "Returns nearby approved active stores ordered by distance or name within the specified radius")
    public ResponseEntity<ApiResponse<List<NearbyStoreResponse>>> getNearbyStores(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(required = false, defaultValue = "5000") Double radius,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false, defaultValue = "false") Boolean hasOffer,
            @RequestParam(required = false) Boolean isOpen,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size,
            @RequestParam(required = false, defaultValue = "distance") String sort,
            HttpServletRequest request) {

        NearbySearchQuery query = new NearbySearchQuery(lat, lng, radius, categoryId, hasOffer, isOpen, page, size, sort);
        PagedResult<NearbyStoreResponse> result = discoveryService.getNearbyStores(query, getClientIp(request));

        return ResponseEntity.ok(ApiResponse.success("Nearby stores fetched successfully", result.content(), result.meta()));
    }

    @GetMapping("/search")
    @Operation(summary = "Search stores and merchants by keyword and optional location",
            description = "Fuzzy keyword matching across merchant business name, store name, and category name")
    public ResponseEntity<ApiResponse<List<StoreSearchResponse>>> searchStores(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radius,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size,
            HttpServletRequest request) {

        StoreSearchQuery query = new StoreSearchQuery(q, categoryId, lat, lng, radius, page, size);
        PagedResult<StoreSearchResponse> result = discoveryService.searchStores(query, getClientIp(request));

        return ResponseEntity.ok(ApiResponse.success("Stores found successfully", result.content(), result.meta()));
    }

    @GetMapping("/search/global")
    @Operation(summary = "Global unified search across stores, categories, and active offers",
            description = "Single unified search query returning stores, matching categories, and offers in one response payload. Supports location sorting and type filtering (ALL, STORE, OFFER, CATEGORY).")
    public ResponseEntity<ApiResponse<GlobalSearchResponse>> globalSearch(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID cityId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radius,
            @RequestParam(required = false, defaultValue = "ALL") String type,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer size,
            HttpServletRequest request) {

        GlobalSearchQuery query = new GlobalSearchQuery(q, cityId, lat, lng, radius, type, page, size);
        GlobalSearchResponse response = discoveryService.globalSearch(query, getClientIp(request));

        return ResponseEntity.ok(ApiResponse.success("Global search results fetched successfully", response));
    }

    @GetMapping("/stores/{storeId}")
    @Operation(summary = "Get public store details",
            description = "Returns safe customer-facing details for an active and approved store")
    public ResponseEntity<ApiResponse<StoreDiscoveryDetailResponse>> getStoreDetails(
            @PathVariable UUID storeId) {

        StoreDiscoveryDetailResponse response = discoveryService.getStoreDetails(storeId);
        return ResponseEntity.ok(ApiResponse.success("Store details fetched successfully", response));
    }

    @GetMapping("/stores/{storeId}/offers")
    @Operation(summary = "Get active offers for a store",
            description = "Returns currently active and valid offers associated with the store or merchant")
    public ResponseEntity<ApiResponse<List<OfferResponse>>> getStoreOffers(
            @PathVariable UUID storeId,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size) {

        PagedResult<OfferResponse> result = discoveryService.getStoreOffers(storeId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Store offers fetched successfully", result.content(), result.meta()));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
