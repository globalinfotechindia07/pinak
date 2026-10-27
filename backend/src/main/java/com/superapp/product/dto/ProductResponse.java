package com.superapp.product.dto;

import com.superapp.product.entity.Product;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        UUID merchantId,
        UUID storeId,
        UUID categoryId,
        String name,
        String brand,
        String unit,
        String description,
        String imageUrl,
        BigDecimal mrp,
        BigDecimal sellingPrice,
        Integer discountPercent,
        String currency,
        Integer stockQuantity,
        Boolean inStock,
        Boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProductResponse fromEntity(Product p) {
        if (p == null) return null;
        return new ProductResponse(
                p.getId(),
                p.getMerchantId(),
                p.getStoreId(),
                p.getCategoryId(),
                p.getName(),
                p.getBrand(),
                p.getUnit(),
                p.getDescription(),
                p.getImageUrl(),
                p.getMrp(),
                p.getSellingPrice(),
                p.getDiscountPercent(),
                p.getCurrency(),
                p.getStockQuantity(),
                p.getInStock(),
                p.getIsActive(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
