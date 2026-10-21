package com.superapp.discover.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Unified, clean Discover Screen DTO definitions.
 * Eliminates scattered boilerplate files by consolidating all Screen 10 response records.
 */
public final class DiscoverDtos {

    private DiscoverDtos() {}

    // ---- 1. Promotional Banners ----
    public record BannersResponse(
            List<BannerItemDto> banners
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BannerItemDto(
            String id,
            String title,
            String subtitle,
            String description,
            String imageUrl,
            String backgroundColor,
            String badgeText,
            String ctaText,
            String actionType,
            String actionTargetId,
            String deeplink,
            Integer displayOrder,
            Instant createdAt,
            Instant countdownEndTime
    ) {}

    // ---- 2. Retail Product Deals ----
    public record ProductDealsResponse(
            int count,
            List<ProductDealDto> deals,
            String cursor
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ProductDealDto(
            UUID id,
            UUID merchantId,
            String storeName,
            String name,
            String brand,
            String unit,
            String description,
            String imageUrl,
            BigDecimal mrp,
            BigDecimal sellingPrice,
            Integer discountPercent,
            String distanceText,
            Integer bonusCoins,
            Boolean inStock
    ) {}

    // ---- 3. Popular Curated Collections ----
    public record PopularCollectionsResponse(
            int count,
            List<PopularCollectionItemDto> collections
    ) {}

    public record PopularCollectionItemDto(
            UUID id,
            String title,
            String subtitle,
            String coverImageUrl,
            String badgeText,
            Integer displayOrder,
            String targetType,
            UUID targetId
    ) {}

    // ---- 4. Discover Benefits ("Why Shop on PINAK?") ----
    public record DiscoverBenefitsResponse(
            int count,
            List<DiscoverBenefitItemDto> benefits
    ) {}

    public record DiscoverBenefitItemDto(
            UUID id,
            String title,
            String subtitle,
            String iconName,
            Integer displayOrder
    ) {}

    // ---- 5. User Recently Viewed History ----
    public record RecentlyViewedResponse(
            int count,
            List<RecentlyViewedItemDto> items
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RecentlyViewedItemDto(
            UUID id,
            String itemType,
            UUID itemId,
            String title,
            String subtitle,
            String imageUrl,
            BigDecimal price,
            BigDecimal originalPrice,
            Integer discountPercent,
            String distanceText,
            Instant viewedAt
    ) {}

    public record RecordRecentlyViewedRequest(
            @NotBlank(message = "Item type is required")
            String itemType,
            @NotNull(message = "Item ID is required")
            UUID itemId,
            UUID branchId
    ) {}

    // ---- 6. Personalized Recommendations ----
    public record RecommendationsResponse(
            int count,
            List<RecommendationItemDto> recommendations
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RecommendationItemDto(
            UUID id,
            String type,
            UUID targetId,
            String title,
            String subtitle,
            String imageUrl,
            String badgeText,
            String reasonText,
            String discountText,
            String distanceText,
            String ctaText
    ) {}
}
