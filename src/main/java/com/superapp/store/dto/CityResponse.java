package com.superapp.store.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.store.entity.City;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CityResponse(
        String id,
        String name,
        String slug,
        String state,
        String country,
        String status,
        Instant createdAt,
        Instant updatedAt
) {
    // Backward compatibility constructor
    public CityResponse(String id, String name, String state, String country, String status, Instant createdAt, Instant updatedAt) {
        this(id, name, null, state, country, status, createdAt, updatedAt);
    }

    public static CityResponse fromEntity(City city) {
        if (city == null) return null;
        return new CityResponse(
                city.getId(),
                city.getName(),
                city.getSlug(),
                city.getState(),
                city.getCountry(),
                city.getStatus() != null ? city.getStatus().name() : null,
                city.getCreatedAt(),
                city.getUpdatedAt()
        );
    }

    public static CityResponse forDiscovery(City city) {
        if (city == null) return null;
        return new CityResponse(
                city.getId(),
                city.getName(),
                city.getSlug(),
                city.getState(),
                city.getCountry(),
                null,
                null,
                null
        );
    }
}
