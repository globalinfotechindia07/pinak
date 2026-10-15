package com.superapp.product.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.product.dto.NearbyProductDealsResponse;
import com.superapp.product.service.ProductDealService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Product Deals", description = "Public endpoints for browsing top product discounts and in-store catalog deals")
public class ProductDealController {

    private final ProductDealService productDealService;

    public ProductDealController(ProductDealService productDealService) {
        this.productDealService = productDealService;
    }

    @GetMapping("/deals/nearby")
    @Operation(summary = "Top Product Deals Near You",
               description = "Returns top in-store grocery, retail, and lifestyle deals near the customer from PostgreSQL products table")
    public ResponseEntity<ApiResponse<NearbyProductDealsResponse>> getNearbyProductDeals(
            @Parameter(description = "Customer latitude", example = "12.9716")
            @RequestParam(required = false) Double latitude,

            @Parameter(description = "Customer longitude", example = "77.6412")
            @RequestParam(required = false) Double longitude,

            @Parameter(description = "Search radius in km", example = "5.0")
            @RequestParam(required = false, defaultValue = "5.0") Double radiusKm,

            @Parameter(description = "Category ID filter")
            @RequestParam(required = false) UUID categoryId,

            @Parameter(description = "Merchant ID filter")
            @RequestParam(required = false) UUID merchantId,

            @Parameter(description = "Sort order, e.g. DISCOUNT, DISTANCE")
            @RequestParam(required = false, defaultValue = "DISCOUNT") String sort,

            @Parameter(description = "Maximum results to return", example = "10")
            @RequestParam(required = false, defaultValue = "10") Integer limit,

            @Parameter(description = "Cursor for pagination")
            @RequestParam(required = false) String cursor) {

        NearbyProductDealsResponse response = productDealService.getNearbyProductDeals(
                latitude, longitude, radiusKm, categoryId, merchantId, sort, limit, cursor);
        return ResponseEntity.ok(ApiResponse.success("Nearby product deals fetched successfully", response));
    }
}
