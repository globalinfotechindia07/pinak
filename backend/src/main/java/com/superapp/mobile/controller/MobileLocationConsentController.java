package com.superapp.mobile.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.mobile.dto.RadarPreviewResponse;
import com.superapp.mobile.dto.UpdatePermissionsRequest;
import com.superapp.mobile.dto.UpdatePermissionsResponse;
import com.superapp.mobile.service.MobileLocationConsentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/mobile/location")
@Tag(name = "Mobile App - Screen 09 Permissions & Location", description = "Location radar preview and permission consent APIs")
public class MobileLocationConsentController {

    private final MobileLocationConsentService locationConsentService;

    public MobileLocationConsentController(MobileLocationConsentService locationConsentService) {
        this.locationConsentService = locationConsentService;
    }

    @GetMapping("/radar-preview")
    @Operation(summary = "Get Geo-Radar Preview (Screen 09)", description = "Returns nearby merchant count, preview cards, and privacy shield before triggering native permission dialog")
    public ResponseEntity<ApiResponse<RadarPreviewResponse>> getRadarPreview(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng
    ) {
        RadarPreviewResponse response = locationConsentService.getRadarPreview(lat, lng);
        return ResponseEntity.ok(ApiResponse.success("Radar preview fetched successfully", response));
    }

    @PostMapping("/update-permissions")
    @Operation(summary = "Update Location & Alert Permissions Consent (Screen 09)", description = "Saves user permission consent, initial GPS coordinates, completes onboarding, and redirects to Home Dashboard")
    public ResponseEntity<ApiResponse<UpdatePermissionsResponse>> updatePermissions(
            @RequestBody(required = false) UpdatePermissionsRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        UpdatePermissionsResponse response = locationConsentService.updatePermissions(request, authHeader);
        return ResponseEntity.ok(ApiResponse.success("Permissions updated successfully", response));
    }
}
