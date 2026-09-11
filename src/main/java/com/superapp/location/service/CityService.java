package com.superapp.location.service;

import com.superapp.location.dto.CreateCityRequest;
import com.superapp.location.dto.UpdateCityRequest;
import com.superapp.store.dto.CityResponse;

import java.util.List;

public interface CityService {

    // Discovery (Public)
    List<CityResponse> getDiscoveryCities();

    CityResponse getDiscoveryCityById(String cityId);

    // Admin Operations
    List<CityResponse> getAllCitiesAdmin();

    CityResponse getCityByIdAdmin(String cityId);

    CityResponse createCityAdmin(CreateCityRequest request, String adminUserId);

    CityResponse updateCityAdmin(String cityId, UpdateCityRequest request, String adminUserId);

    void deactivateCityAdmin(String cityId, String adminUserId);
}
