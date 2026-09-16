package com.superapp.category.dto;

import com.superapp.category.entity.CategoryStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateCategoryStatusRequest(
        @NotNull(message = "Status is required")
        CategoryStatus status
) {}
