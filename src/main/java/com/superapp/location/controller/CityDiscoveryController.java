package com.superapp.location.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.location.service.CityService;
import com.superapp.store.dto.CityResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/discovery/cities")
@Tag(name = "Customer Discovery — Cities", description = "Public city lookup endpoints for discovery and filtering")
public class CityDiscoveryController {

    private final CityService cityService;

    public CityDiscoveryController(CityService cityService) {
        this.cityService = cityService;
    }

    @GetMapping
    @Operation(summary = "List active cities for discovery (Public)")
    public ResponseEntity<ApiResponse<List<CityResponse>>> getDiscoveryCities() {
        List<CityResponse> cities = cityService.getDiscoveryCities();
        return ResponseEntity.ok(ApiResponse.success("Cities fetched successfully", cities));
    }

    @GetMapping("/{cityId}")
    @Operation(summary = "Get single city for discovery (Public, active only)")
    public ResponseEntity<ApiResponse<CityResponse>> getDiscoveryCityById(@PathVariable String cityId) {
        CityResponse city = cityService.getDiscoveryCityById(cityId);
        return ResponseEntity.ok(ApiResponse.success("City fetched successfully", city));
    }
}
