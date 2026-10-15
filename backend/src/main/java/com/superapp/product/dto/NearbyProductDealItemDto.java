package com.superapp.product.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Product deal item near customer")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record NearbyProductDealItemDto(
        @Schema(description = "Product ID", example = "p0000000-0000-0000-0000-000000000001")
        String productId,

        @Schema(description = "Product name", example = "Amul Fresh Milk")
        String name,

        @Schema(description = "Brand name", example = "Amul")
        String brand,

        @Schema(description = "Product image URL")
        String imageUrl,

        @Schema(description = "Product category summary")
        ProductCategorySummaryDto category,

        @Schema(description = "Product unit descriptor", example = "1 litre")
        String unit,

        @Schema(description = "Pricing and discount breakdown")
        ProductPriceSummaryDto price,

        @Schema(description = "Associated offer badge details")
        ProductOfferBadgeDto offer,

        @Schema(description = "Store branch selling this item")
        ProductBranchSummaryDto branch,

        @Schema(description = "Stock status")
        ProductAvailabilityDto availability,

        @Schema(description = "Whether favorited by current user", example = "false")
        Boolean isFavorite,

        @Schema(description = "CTA text", example = "Add to Cart")
        String ctaText
) {
    public record ProductCategorySummaryDto(
            String categoryId,
            String name
    ) {}

    public record ProductPriceSummaryDto(
            String currency,
            BigDecimal sellingPrice,
            BigDecimal mrp,
            Integer discountPercent
    ) {}

    public record ProductOfferBadgeDto(
            String offerId,
            String badgeText,
            String offerType
    ) {}

    public record ProductBranchSummaryDto(
            String branchId,
            String merchantName,
            Integer distanceMeters
    ) {}

    public record ProductAvailabilityDto(
            Boolean inStock,
            String stockStatus
    ) {}
}
