package com.superapp.category.dto;

import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import java.time.Instant;
import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String name,
        UUID parentId,
        String parentName,
        CategoryStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static CategoryResponse fromEntity(Category category) {
        if (category == null) return null;
        UUID pId = category.getParent() != null ? category.getParent().getId() : null;
        String pName = category.getParent() != null ? category.getParent().getName() : null;
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                pId,
                pName,
                category.getStatus(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
