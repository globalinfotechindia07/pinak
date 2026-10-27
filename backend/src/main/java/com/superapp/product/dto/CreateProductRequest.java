package com.superapp.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateProductRequest(
        @NotNull(message = "Merchant ID is required")
        UUID merchantId,

        UUID storeId,

        UUID categoryId,

        @NotBlank(message = "Product / Dish name is required")
        String name,

        String brand,

        String unit, // e.g. "Serves 2", "1 Litre", "500g"

        String description,

        String imageUrl,

        @NotNull(message = "MRP is required")
        @Positive(message = "MRP must be positive")
        BigDecimal mrp,

        @NotNull(message = "Selling price is required")
        @Positive(message = "Selling price must be positive")
        BigDecimal sellingPrice,

        Integer discountPercent,

        Integer stockQuantity,

        Boolean inStock,

        Boolean isActive
) {}
