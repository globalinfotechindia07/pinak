package com.superapp.discovery.dto;

import java.util.UUID;

public record StoreSearchQuery(
        String q,
        UUID categoryId,
        Double lat,
        Double lng,
        Double radius,
        Integer page,
        Integer size
) {
    public int getEffectivePage() {
        return page != null && page >= 0 ? page : 0;
    }

    public int getEffectiveSize() {
        if (size == null || size <= 0) return 20;
        return Math.min(size, 100);
    }

    public Double getEffectiveRadius() {
        if (lat == null || lng == null) return null;
        return radius != null && radius > 0 ? radius : 5000.0;
    }

    public boolean hasCoordinates() {
        return lat != null && lng != null;
    }
}
