package com.superapp.mobile.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.mobile.dto.MobileServiceDetailDto;
import com.superapp.mobile.service.MobileServiceDetailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@Tag(name = "Mobile App - Service & Store Detail (Screen 11)",
     description = "Comprehensive store/service card click detail view API matching code.html specification")
public class MobileServiceDetailController {

    private final MobileServiceDetailService serviceDetailService;

    public MobileServiceDetailController(MobileServiceDetailService serviceDetailService) {
        this.serviceDetailService = serviceDetailService;
    }

    @GetMapping({
            "/api/v1/mobile/stores/{storeId}/detail",
            "/api/v1/mobile/services/{storeId}/detail",
            "/api/v1/discovery/stores/{storeId}/detail"
    })
    @Operation(
            summary = "Fetch Mobile Store / Service Detail View (Screen 11)",
            description = "Returns the comprehensive store detail view payload when user clicks on a service card from the home or discovery feed. " +
                    "Includes Hero with 19 photos, 2X Coin incentive banner, sticky tabs, active pre-booking and walk-in offers, " +
                    "flash sale deals, menu highlights, photo mosaic, verified amenities, GPS location, concierge support, similar places, and sticky bottom bar."
    )
    public ResponseEntity<ApiResponse<MobileServiceDetailDto>> getStoreServiceDetail(
            @PathVariable @Parameter(description = "Store Outlet UUID", example = "e1000000-0000-0000-0000-000000000001") UUID storeId,
            @RequestParam(required = false) @Parameter(description = "Customer Device Latitude", example = "12.9716") Double lat,
            @RequestParam(required = false) @Parameter(description = "Customer Device Longitude", example = "77.6412") Double lng
    ) {
        MobileServiceDetailDto response = serviceDetailService.getServiceDetail(storeId, lat, lng);
        return ResponseEntity.ok(ApiResponse.success("Store service detail fetched successfully", response));
    }
}
