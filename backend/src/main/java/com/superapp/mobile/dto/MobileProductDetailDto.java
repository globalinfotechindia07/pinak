package com.superapp.mobile.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Schema(description = "Screen 11/12 - Comprehensive Mobile Product Detail View Payload")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record MobileProductDetailDto(
        // Basic Identity
        String id,
        String name,
        String brand,
        String unit,
        String shortDescription,
        String longDescription,
        String imageUrl,
        List<String> galleryImages,
        int totalPhotosCount,

        // Pricing & Discounts
        BigDecimal mrp,
        BigDecimal sellingPrice,
        Integer discountPercent,
        BigDecimal savingsAmount,
        String discountText,
        String currency,
        String currencySymbol,

        // Inventory & Availability
        boolean inStock,
        int stockQuantity,
        String stockStatusText,
        boolean isVeg,
        String dietaryType,

        // Categorization & Badges
        CategorySummaryDto category,
        List<String> tags,
        Double rating,
        String ratingCountText,

        // Gold Coins Incentive
        ProductCoinPerkDto coinsPerkBanner,
        ProductCoinPerkDto coinPerkBanner,

        // Merchant / Store Source
        ProductStoreInfoDto storeInfo,

        // Specifications & Highlights
        List<String> keyHighlights,
        Map<String, String> nutritionFacts,
        DeliveryOptionsDto deliveryOptions,

        // Customer Reviews
        ReviewsSummaryDto reviewsSummary,

        // Related & Cross-sell Carousels
        List<SimpleProductCardDto> frequentlyBoughtTogether,
        List<SimpleProductCardDto> similarProducts,

        // Sticky Bottom Buy Bar
        BottomBuyBarDto bottomBar
) implements Serializable {

    public record CategorySummaryDto(
            String id,
            String name,
            String slug
    ) implements Serializable {}

    public record ProductCoinPerkDto(
            String multiplier,
            String title,
            String badgeText,
            String earnedCoinsText
    ) implements Serializable {}

    public record ProductStoreInfoDto(
            String id,
            String name,
            boolean isVerified,
            Double rating,
            String distanceText,
            String address,
            String phone,
            boolean isOpenNow
    ) implements Serializable {}

    public record DeliveryOptionsDto(
            boolean instantDeliveryAvailable,
            String deliveryTimeText,
            String freeDeliveryThresholdText,
            boolean storePickupAvailable,
            String storePickupText
    ) implements Serializable {}

    public record ReviewsSummaryDto(
            Double averageRating,
            int totalReviews,
            Map<String, Integer> breakdown,
            List<FeaturedReviewDto> featuredReviews
    ) implements Serializable {}

    public record FeaturedReviewDto(
            String userName,
            String userAvatar,
            int rating,
            String date,
            String comment,
            boolean isVerifiedPurchase
    ) implements Serializable {}

    public record SimpleProductCardDto(
            String id,
            String name,
            BigDecimal price,
            BigDecimal mrp,
            Double rating,
            String imageUrl
    ) implements Serializable {}

    public record BottomBuyBarDto(
            BigDecimal sellingPrice,
            BigDecimal mrp,
            String savingsText,
            int minQuantity,
            int maxQuantity,
            boolean isCustomizable,
            String customizationText,
            ActionBtnDto primaryAction,
            ActionBtnDto secondaryAction
    ) implements Serializable {}

    public record ActionBtnDto(
            String type,
            String label,
            boolean enabled
    ) implements Serializable {}
}
