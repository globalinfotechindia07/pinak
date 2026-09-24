package com.superapp.discovery.dto;

import java.util.UUID;

public record GlobalSearchQuery(
        String q,
        UUID cityId,
        Integer page,
        Integer size
) {
    public int getEffectivePage() {
        return (page == null || page < 0) ? 0 : page;
    }

    public int getEffectiveSize() {
        return (size == null || size <= 0 || size > 50) ? 10 : size;
    }

    public boolean hasKeyword() {
        return q != null && !q.trim().isEmpty();
    }
}
