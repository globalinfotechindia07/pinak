package com.superapp.category.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Category details for navigation and discovery")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CategoryResponse(
        @Schema(description = "Category UUID", example = "11111111-1111-1111-1111-111111111101")
        UUID id,

        @Schema(description = "Category ID string format", example = "11111111-1111-1111-1111-111111111101")
        String categoryId,

        @Schema(description = "Category name", example = "Food & Dining")
        String name,

        @Schema(description = "URL-friendly slug", example = "food-and-dining")
        String slug,

        @Schema(description = "Category description", example = "Restaurants, cafes, bakeries and diners")
        String description,

        @Schema(description = "Category icon token", example = "utensils")
        String icon,

        @Schema(description = "CDN icon URL", example = "https://cdn.example.com/categories/dining.png")
        String iconUrl,

        @Schema(description = "Icon symbol name for mobile icons", example = "utensils")
        String iconName,

        @Schema(description = "Hex theme background color", example = "#FFF0E8")
        String color,

        @Schema(description = "Display sequence order", example = "1")
        Integer displayOrder,

        @Schema(description = "Parent category UUID if subcategory")
        UUID parentId,

        @Schema(description = "Parent category name")
        String parentName,

        @Schema(description = "Category lifecycle status", example = "ACTIVE")
        CategoryStatus status,

        @Schema(description = "Active status flag for mobile clients", example = "true")
        Boolean isActive,

        @Schema(description = "Creation timestamp")
        Instant createdAt,

        @Schema(description = "Last update timestamp")
        Instant updatedAt
) {
    // 11-arg backward-compatibility constructor
    public CategoryResponse(
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
        this(
                id,
                id != null ? id.toString() : null,
                name,
                slug,
                description,
                icon,
                deriveIconUrl(slug, icon),
                deriveIconName(slug, icon),
                deriveColor(slug),
                displayOrder != null ? displayOrder : 0,
                parentId,
                parentName,
                status != null ? status : CategoryStatus.ACTIVE,
                status == CategoryStatus.ACTIVE,
                createdAt,
                updatedAt
        );
    }

    // 7-arg backward-compatibility constructor
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

    /** Discovery list response representation */
    public static CategoryResponse forDiscovery(Category category) {
        if (category == null) return null;
        return fromEntity(category);
    }

    /** Single category discovery response */
    public static CategoryResponse forSingleDiscovery(Category category) {
        if (category == null) return null;
        return fromEntity(category);
    }

    public static String deriveIconName(String slug, String icon) {
        if (icon != null && !icon.isBlank() && !icon.startsWith("http")) return icon;
        if (slug == null) return "tag";
        if (slug.contains("food") || slug.contains("dining") || slug.contains("restaurant")) return "utensils";
        if (slug.contains("cafe") || slug.contains("coffee") || slug.contains("bakery")) return "coffee";
        if (slug.contains("health") || slug.contains("gym") || slug.contains("fitness")) return "dumbbell";
        if (slug.contains("salon") || slug.contains("spa") || slug.contains("service")) return "scissors";
        if (slug.contains("retail") || slug.contains("shop") || slug.contains("supermarket") || slug.contains("grocer")) return "shopping-bag";
        if (slug.contains("hardware")) return "wrench";
        if (slug.contains("electronic")) return "cpu";
        return "tag";
    }

    public static String deriveColor(String slug) {
        if (slug == null) return "#F3F4F6";
        if (slug.contains("food") || slug.contains("dining") || slug.contains("restaurant")) return "#FFF0E8";
        if (slug.contains("cafe") || slug.contains("coffee") || slug.contains("bakery")) return "#FEF3C7";
        if (slug.contains("health") || slug.contains("gym") || slug.contains("fitness")) return "#D9FBEA";
        if (slug.contains("salon") || slug.contains("spa") || slug.contains("service")) return "#FCE7F3";
        if (slug.contains("retail") || slug.contains("shop") || slug.contains("supermarket") || slug.contains("grocer")) return "#E0E7FF";
        if (slug.contains("hardware")) return "#EDE9FE";
        if (slug.contains("electronic")) return "#CFFAFE";
        return "#F3F4F6";
    }

    public static String deriveIconUrl(String slug, String icon) {
        if (icon != null && icon.startsWith("http")) return icon;
        String s = slug != null ? slug : "general";
        return "https://cdn.pinak.in/categories/" + s + ".png";
    }
}
