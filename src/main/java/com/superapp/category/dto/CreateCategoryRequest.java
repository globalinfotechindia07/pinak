package com.superapp.category.dto;

import com.superapp.category.entity.CategoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateCategoryRequest(
        @NotBlank(message = "Category name must not be blank")
        @Size(min = 2, max = 100, message = "Category name must be between 2 and 100 characters")
        String name,

        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must contain only lowercase alphanumeric characters separated by single hyphens")
        @Size(max = 128, message = "Slug must not exceed 128 characters")
        String slug,

        @Size(max = 500, message = "Description must not exceed 500 characters")
        String description,

        @Size(max = 100, message = "Icon must not exceed 100 characters")
        String icon,

        @PositiveOrZero(message = "Display order must be zero or positive")
        Integer displayOrder,

        UUID parentId,

        CategoryStatus status
) {
    public CreateCategoryRequest(String name, UUID parentId, CategoryStatus status) {
        this(name, null, null, null, 0, parentId, status);
    }

    public CreateCategoryRequest(String name, String slug, String description, String icon, Integer displayOrder) {
        this(name, slug, description, icon, displayOrder, null, CategoryStatus.ACTIVE);
    }
}
