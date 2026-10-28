package com.superapp.mobile.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.mobile.dto.MobileProductDetailDto;
import com.superapp.mobile.service.MobileProductDetailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@Tag(name = "Mobile App - Product Detail",
     description = "Comprehensive retail product, gourmet dish, and inventory item detail view API")
public class MobileProductDetailController {

    private static final UUID DEFAULT_PRODUCT_ID = UUID.fromString("f1000000-0000-0000-0000-000000000001");

    private final MobileProductDetailService productDetailService;

    public MobileProductDetailController(MobileProductDetailService productDetailService) {
        this.productDetailService = productDetailService;
    }

    @GetMapping({
            "/api/v1/mobile/products/{productId}/detail",
            "/api/v1/mobile/products/detail",
            "//api/v1/mobile/products/detail",
            "/api/v1/products/{productId}/detail",
            "/api/v1/products/detail",
            "/api/v1/discovery/products/{productId}/detail",
            "/api/v1/discovery/products/detail"
    })
    @Operation(
            summary = "Fetch Mobile Product Detail View",
            description = "Returns comprehensive product detail payload when user clicks on a product deal or menu item card. " +
                    "Includes high-res gallery, pricing, discounts, stock urgency, 2X Coin incentive, store origin, " +
                    "nutritional specs, customer reviews, frequently bought together, similar products, and sticky Add-to-Cart bar."
    )
    public ResponseEntity<ApiResponse<MobileProductDetailDto>> getProductDetail(
            @PathVariable(required = false) @Parameter(description = "Product UUID", example = "p1000000-0000-0000-0000-000000000001") UUID productId,
            @RequestParam(required = false) @Parameter(description = "Customer Device Latitude", example = "12.9716") Double lat,
            @RequestParam(required = false) @Parameter(description = "Customer Device Longitude", example = "77.6412") Double lng
    ) {
        UUID effectiveId = productId != null ? productId : DEFAULT_PRODUCT_ID;
        MobileProductDetailDto response = productDetailService.getProductDetail(effectiveId, lat, lng);
        return ResponseEntity.ok(ApiResponse.success("Product detail fetched successfully", response));
    }
}
