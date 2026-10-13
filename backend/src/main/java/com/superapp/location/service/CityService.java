package com.superapp.location.service;

import com.superapp.location.dto.CreateCityRequest;
import com.superapp.location.dto.UpdateCityRequest;
import com.superapp.store.dto.CityResponse;

import java.util.List;

public interface CityService {

    // Discovery (Public)
    List<CityResponse> getDiscoveryCities();

    List<CityResponse> getDiscoveryCities(String state);

    List<String> getDiscoveryStates();

    List<String> getDistrictsForState(String state);

    List<String> getCitiesForDistrictOrState(String state, String district);

    PincodeLookupResponse lookupPincode(String pincode);

    CityResponse getDiscoveryCityById(String cityId);

    // Admin Operations
    List<CityResponse> getAllCitiesAdmin();

    CityResponse getCityByIdAdmin(String cityId);

    CityResponse createCityAdmin(CreateCityRequest request, String adminUserId);

    CityResponse updateCityAdmin(String cityId, UpdateCityRequest request, String adminUserId);

    CityResponse updateCityStatusAdmin(String cityId, com.superapp.store.enums.CityStatus status, String adminUserId);

    void deactivateCityAdmin(String cityId, String adminUserId);

    record DistrictData(String name, List<String> cities) {}

    record StateData(String state, String code, List<DistrictData> districts) {}

    record PincodeLookupResponse(
            String pincode,
            String state,
            String district,
            String city,
            List<String> availableDistricts,
            List<String> availableCities
    ) {}
}
