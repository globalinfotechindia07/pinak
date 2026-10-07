package com.superapp.category.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;

import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CategoryTreeResponse(
        UUID id,
        String name,
        String slug,
        String description,
        String icon,
        Integer displayOrder,
        CategoryStatus status,
        List<CategoryTreeResponse> subcategories
) {
    public static CategoryTreeResponse from(Category category, List<CategoryTreeResponse> subcategories) {
        if (category == null) return null;
        return new CategoryTreeResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getIcon(),
                category.getDisplayOrder(),
                category.getStatus(),
                subcategories != null ? subcategories : List.of()
        );
    }

    public static CategoryTreeResponse leaf(Category category) {
        if (category == null) return null;
        return new CategoryTreeResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getIcon(),
                category.getDisplayOrder(),
                category.getStatus(),
                List.of()
        );
    }
}
