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
@RequestMapping({"/api/v1/discovery", "/api/v1/mobile/locations"})
@Tag(name = "Customer Discovery — Cities & States", description = "Public city and state lookup endpoints for discovery, registration, and filtering")
public class CityDiscoveryController {

    private final CityService cityService;

    public CityDiscoveryController(CityService cityService) {
        this.cityService = cityService;
    }

    @GetMapping("/cities")
    @Operation(summary = "List active cities for discovery (Public, optionally filtered by state)")
    public ResponseEntity<ApiResponse<List<CityResponse>>> getDiscoveryCities(
            @RequestParam(required = false) String state) {
        List<CityResponse> cities = (state != null && !state.isBlank())
                ? cityService.getDiscoveryCities(state)
                : cityService.getDiscoveryCities();
        return ResponseEntity.ok(ApiResponse.success("Cities fetched successfully", cities));
    }

    @GetMapping({"/states", "/cities/states"})
    @Operation(summary = "List states for discovery dropdowns (Public)")
    public ResponseEntity<ApiResponse<List<String>>> getDiscoveryStates() {
        List<String> states = cityService.getDiscoveryStates();
        return ResponseEntity.ok(ApiResponse.success("States fetched successfully", states));
    }

    @GetMapping({"/districts", "/cities/districts"})
    @Operation(summary = "List districts for a state from India master locations (Public)")
    public ResponseEntity<ApiResponse<List<String>>> getDistricts(
            @RequestParam(required = false) String state) {
        List<String> districts = cityService.getDistrictsForState(state);
        return ResponseEntity.ok(ApiResponse.success("Districts fetched successfully", districts));
    }

    @GetMapping({"/cities/names", "/district-cities"})
    @Operation(summary = "List city names for a state and optional district (Public)")
    public ResponseEntity<ApiResponse<List<String>>> getCityNames(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district) {
        List<String> cities = cityService.getCitiesForDistrictOrState(state, district);
        return ResponseEntity.ok(ApiResponse.success("Cities fetched successfully", cities));
    }

    @GetMapping({"/pincode/{pincode}", "/pincode"})
    @Operation(summary = "Lookup State, District and City by 6-digit Pincode (Public)")
    public ResponseEntity<ApiResponse<CityService.PincodeLookupResponse>> lookupPincode(
            @PathVariable(required = false) String pincode,
            @RequestParam(required = false) String code) {
        String cleanPincode = (pincode != null && !pincode.isBlank()) ? pincode : code;
        CityService.PincodeLookupResponse response = cityService.lookupPincode(cleanPincode);
        return ResponseEntity.ok(ApiResponse.success("Pincode details fetched successfully", response));
    }

    @GetMapping("/cities/{cityId}")
    @Operation(summary = "Get single city for discovery (Public, active only)")
    public ResponseEntity<ApiResponse<CityResponse>> getDiscoveryCityById(@PathVariable String cityId) {
        CityResponse city = cityService.getDiscoveryCityById(cityId);
        return ResponseEntity.ok(ApiResponse.success("City fetched successfully", city));
    }
}
