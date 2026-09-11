package com.superapp.location.mapper;

import com.superapp.location.dto.CreateCityRequest;
import com.superapp.store.dto.CityResponse;
import com.superapp.store.entity.City;
import com.superapp.store.enums.CityStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CityMapper {

    public City toEntity(CreateCityRequest request) {
        if (request == null) return null;
        String id = "city_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String country = request.country() != null && !request.country().isBlank() ? request.country().trim() : "India";
        return new City(
                id,
                request.name().trim(),
                request.slug() != null ? request.slug().trim().toLowerCase() : null,
                request.state().trim(),
                country,
                CityStatus.ACTIVE
        );
    }

    public CityResponse toResponse(City city) {
        return CityResponse.fromEntity(city);
    }

    public CityResponse toDiscoveryResponse(City city) {
        return CityResponse.forDiscovery(city);
    }
}
