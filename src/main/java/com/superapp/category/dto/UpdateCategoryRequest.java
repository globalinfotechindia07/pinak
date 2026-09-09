package com.superapp.category.dto;

import com.superapp.category.entity.CategoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record UpdateCategoryRequest(
        @NotBlank(message = "Category name must not be blank")
        @Size(min = 2, max = 100, message = "Category name must be between 2 and 100 characters")
        String name,

        UUID parentId,

        CategoryStatus status
) {
}
