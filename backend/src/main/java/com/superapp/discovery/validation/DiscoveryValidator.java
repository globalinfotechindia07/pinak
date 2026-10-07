package com.superapp.discovery.validation;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class DiscoveryValidator {

    private static final Set<String> ALLOWED_SORTS = Set.of("distance", "name");

    private final double maxRadius;
    private final double minRadius;
    private final int maxPageSize;

    public DiscoveryValidator(
            @Value("${app.discovery.max-radius-meters:50000}") double maxRadius,
            @Value("${app.discovery.min-radius-meters:10}") double minRadius,
            @Value("${app.discovery.max-page-size:100}") int maxPageSize) {
        this.maxRadius = maxRadius;
        this.minRadius = minRadius;
        this.maxPageSize = maxPageSize;
    }

    public void validateCoordinates(Double lat, Double lng) {
        List<Map<String, String>> details = new ArrayList<>();

        if (lat == null || lat < -90.0 || lat > 90.0) {
            details.add(Map.of("field", "lat", "message", "Latitude must be between -90 and 90"));
        }

        if (lng == null || lng < -180.0 || lng > 180.0) {
            details.add(Map.of("field", "lng", "message", "Longitude must be between -180 and 180"));
        }

        if (!details.isEmpty()) {
            throw new AppException("Invalid coordinates", ApiError.INVALID_COORDINATES, 400, details);
        }
    }

    public void validateRadius(Double radius) {
        if (radius == null) return;

        if (radius < minRadius || radius > maxRadius) {
            List<Map<String, String>> details = List.of(
                    Map.of("field", "radius", "message", "Radius exceeds the maximum allowed value")
            );
            throw new AppException("Invalid radius", ApiError.INVALID_RADIUS, 400, details);
        }
    }

    public void validateSort(String sort) {
        if (sort == null || sort.isBlank()) return;
        if (!ALLOWED_SORTS.contains(sort.trim().toLowerCase())) {
            throw new AppException("Invalid sort field: '" + sort + "'. Allowed: " + ALLOWED_SORTS,
                    ApiError.VALIDATION_FAILED, 400);
        }
    }

    public void validateSearchKeyword(String q) {
        if (q != null && q.trim().length() > 100) {
            throw new AppException("Search query exceeds maximum length of 100 characters",
                    ApiError.VALIDATION_FAILED, 400);
        }
    }

    public int clampPageSize(Integer size) {
        if (size == null || size <= 0) return 20;
        return Math.min(size, maxPageSize);
    }
}
