package com.superapp.category.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CategoryResponse(
        UUID id,
        String name,
        String slug,
        String description,
        String icon,
        Integer displayOrder,
        UUID parentId,
        String parentName,
        CategoryStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    // Backward-compatibility constructor
    public CategoryResponse(UUID id, String name, UUID parentId, String parentName, CategoryStatus status, Instant createdAt, Instant updatedAt) {
        this(id, name, null, null, null, 0, parentId, parentName, status, createdAt, updatedAt);
    }

    public static CategoryResponse fromEntity(Category category) {
        if (category == null) return null;
        UUID pId = category.getParent() != null ? category.getParent().getId() : null;
        String pName = category.getParent() != null ? category.getParent().getName() : null;
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getIcon(),
                category.getDisplayOrder(),
                pId,
                pName,
                category.getStatus(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }

    /** Discovery list response representation (omitting timestamps/status/parent details) */
    public static CategoryResponse forDiscovery(Category category) {
        if (category == null) return null;
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                null,
                category.getIcon(),
                category.getDisplayOrder(),
                null,
                null,
                null,
                null,
                null
        );
    }

    /** Single category discovery response */
    public static CategoryResponse forSingleDiscovery(Category category) {
        if (category == null) return null;
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getIcon(),
                category.getDisplayOrder(),
                null,
                null,
                category.getStatus(),
                null,
                null
        );
    }
}
