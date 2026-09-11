package com.superapp.location.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.location.dto.CreateCityRequest;
import com.superapp.location.dto.UpdateCityRequest;
import com.superapp.location.service.CityService;
import com.superapp.store.dto.CityResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/cities")
@Tag(name = "Admin Cities", description = "Admin master data management for cities and locations")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminCityController {

    private final CityService cityService;

    public AdminCityController(CityService cityService) {
        this.cityService = cityService;
    }

    @GetMapping
    @Operation(summary = "Get all cities (Admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<CityResponse>>> getAllCities() {
        List<CityResponse> list = cityService.getAllCitiesAdmin();
        return ResponseEntity.ok(ApiResponse.success("Cities fetched successfully", list));
    }

    @PostMapping
    @Operation(summary = "Create a city (Admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CityResponse>> createCity(
            @Valid @RequestBody CreateCityRequest request,
            Authentication authentication) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        CityResponse response = cityService.createCityAdmin(request, adminUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("City created successfully", response));
    }

    @GetMapping("/{cityId}")
    @Operation(summary = "Get city by ID (Admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CityResponse>> getCityById(@PathVariable String cityId) {
        CityResponse response = cityService.getCityByIdAdmin(cityId);
        return ResponseEntity.ok(ApiResponse.success("City fetched successfully", response));
    }

    @PutMapping("/{cityId}")
    @Operation(summary = "Update city by ID (Admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CityResponse>> updateCity(
            @PathVariable String cityId,
            @Valid @RequestBody UpdateCityRequest request,
            Authentication authentication) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        CityResponse response = cityService.updateCityAdmin(cityId, request, adminUser);
        return ResponseEntity.ok(ApiResponse.success("City updated successfully", response));
    }

    @DeleteMapping("/{cityId}")
    @Operation(summary = "Deactivate city logically (Admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deactivateCity(
            @PathVariable String cityId,
            Authentication authentication) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        cityService.deactivateCityAdmin(cityId, adminUser);
        return ResponseEntity.noContent().build();
    }
}
