package com.superapp.mobile.controller;

import com.superapp.category.dto.CategoryResponse;
import com.superapp.common.response.ApiResponse;
import com.superapp.mobile.dto.MobileDtos.*;
import com.superapp.mobile.service.MobileAppService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Unified Controller for Mobile Onboarding screens (Categories, Geo-Radar, and Permissions Consent).
 * Covers Screens 08 and 09.
 */
@RestController
@Tag(name = "Mobile App - Onboarding & Location", description = "PINAK Mobile Categories and Screen 09 Geo-Radar & Permission Consent APIs")
public class MobileAppController {

    private final MobileAppService mobileAppService;

    public MobileAppController(MobileAppService mobileAppService) {
        this.mobileAppService = mobileAppService;
    }

    @GetMapping({"/api/v1/mobile/categories", "/api/v1/mobile/profile/categories", "/api/v1/mobile/auth/categories"})
    @Operation(summary = "Get Mobile Categories (Screen 08)", description = "Returns active platform categories for mobile onboarding and preference selection")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getMobileCategories() {
        List<CategoryResponse> categories = mobileAppService.getMobileCategories();
        return ResponseEntity.ok(ApiResponse.success("Categories retrieved successfully", categories));
    }

    @GetMapping("/api/v1/mobile/location/radar-preview")
    @Operation(summary = "Get Geo-Radar Preview (Screen 09)", description = "Returns nearby merchant count, preview cards, and privacy shield before triggering native permission dialog")
    public ResponseEntity<ApiResponse<RadarPreviewResponse>> getRadarPreview(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng
    ) {
        RadarPreviewResponse response = mobileAppService.getRadarPreview(lat, lng);
        return ResponseEntity.ok(ApiResponse.success("Radar preview fetched successfully", response));
    }

    @PostMapping({"/api/v1/mobile/location/update-permissions", "/api/v1/mobile/location/permissions"})
    @Operation(summary = "Update Location & Alert Permissions Consent (Screen 09)", description = "Saves user permission consent, initial GPS coordinates, completes onboarding, and redirects to Home Dashboard")
    public ResponseEntity<ApiResponse<UpdatePermissionsResponse>> updatePermissions(
            @RequestBody(required = false) UpdatePermissionsRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        UpdatePermissionsResponse response = mobileAppService.updatePermissions(request, authHeader);
        return ResponseEntity.ok(ApiResponse.success("Permissions updated successfully", response));
    }
}
