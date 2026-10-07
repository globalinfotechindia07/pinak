package com.superapp.discovery.dto;

import java.util.UUID;

public record NearbySearchQuery(
        Double lat,
        Double lng,
        Double radius,
        UUID categoryId,
        Boolean hasOffer,
        Boolean isOpen,
        Integer page,
        Integer size,
        String sort
) {
    public int getEffectivePage() {
        return page != null && page >= 0 ? page : 0;
    }

    public int getEffectiveSize() {
        if (size == null || size <= 0) return 20;
        return Math.min(size, 100);
    }

    public double getEffectiveRadius() {
        return radius != null && radius > 0 ? radius : 5000.0;
    }

    public String getEffectiveSort() {
        if (sort == null || sort.isBlank()) return "distance";
        String s = sort.trim().toLowerCase();
        return s.equals("name") ? "name" : "distance";
    }

    public boolean isSortByDistance() {
        return "distance".equalsIgnoreCase(getEffectiveSort());
    }
}
