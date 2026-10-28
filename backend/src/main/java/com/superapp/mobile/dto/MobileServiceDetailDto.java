package com.superapp.mobile.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@Schema(description = "Screen 11 - Mobile Store and Service Card Detail View Payload matching code.html exactly")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record MobileServiceDetailDto(
        // Hero & Identity
        String id,
        String storeName,
        String merchantName,
        boolean isVerified,
        String coverImageUrl,
        List<String> heroPhotos,
        int totalPhotosCount,
        String photoCounterText,
        Double distanceMeters,
        String distanceText,
        String cuisines,
        String priceForTwoText,
        String cuisineAndPriceText,
        Double rating,
        String ratingCountText,
        boolean isOpenNow,
        String openStatusText,
        String openingTime,
        String closingTime,
        String phone,
        Double latitude,
        Double longitude,
        String address,
        String googleMapsUrl,

        // Top Incentive Banner
        CoinPerkBannerDto coinPerkBanner,

        // Navigation Tabs
        List<String> availableTabs,

        // Offers & Savings Section
        OffersSectionDto offersSection,

        // Flash Sale Deals Section
        FlashSaleSectionDto flashSales,

        // Menu Highlights Section
        MenuHighlightsSectionDto menuSection,

        // Photos Mosaic Section
        PhotoMosaicSectionDto photoMosaic,

        // Verified Amenities Section
        List<AmenityItemDto> amenities,

        // Location & Directions Section
        LocationSectionDto locationSection,

        // Help & Support Concierge
        ConciergeSupportDto concierge,

        // Similar Places Recommendations
        List<SimilarPlaceCardDto> similarPlaces,

        // Sticky Bottom Action Bar
        StickyBottomBarDto bottomBar
) implements Serializable {

    public record CoinPerkBannerDto(
            String multiplier,
            String title,
            String tag
    ) implements Serializable {}

    public record OffersSectionDto(
            String activeOffersCountText,
            StoreOfferCardDto primaryOffer,
            List<StoreOfferCardDto> preBookingOffers,
            List<StoreOfferCardDto> walkInOffers,
            List<PartnerChipDto> partnerIncentiveChips,
            String greenPerkHighlight
    ) implements Serializable {}

    public record StoreOfferCardDto(
            String id,
            String title,
            String subtitle,
            String discountType,
            BigDecimal discountValue,
            BigDecimal maxDiscountAmount,
            BigDecimal minimumOrderAmount,
            List<String> badges,
            String termsAndConditions,
            String redemptionType,
            Integer minAdvanceHours,
            String ctaText,
            boolean isAutoApplied,
            Integer bonusCoins,
            BigDecimal coverChargeAmount,
            Integer minPartySize,
            Integer maxPartySize,
            Integer gracePeriodMinutes,
            String slotTimes,
            Boolean isTableBookingEnabled
    ) implements Serializable {}

    public record PartnerChipDto(
            String id,
            String title,
            String subtitle,
            String badge,
            String type
    ) implements Serializable {}

    public record FlashSaleSectionDto(
            String title,
            String badge,
            String viewAllText,
            List<FlashSaleDealDto> deals
    ) implements Serializable {}

    public record FlashSaleDealDto(
            String id,
            String title,
            String imageUrl,
            String discountBadge,
            BigDecimal dealPrice,
            BigDecimal originalPrice,
            String ctaText
    ) implements Serializable {}

    public record MenuHighlightsSectionDto(
            String categoryTitle,
            List<MenuItemDto> items,
            String menuPagesText,
            int totalPagesCount,
            List<String> menuImages
    ) implements Serializable {}

    public record MenuItemDto(
            String name,
            String description,
            BigDecimal price,
            boolean isVeg,
            String category
    ) implements Serializable {}

    public record PhotoMosaicSectionDto(
            String primaryPhoto,
            List<String> secondaryPhotos,
            String additionalCountText,
            int totalPhotosCount,
            List<String> allPhotos
    ) implements Serializable {}

    public record AmenityItemDto(
            String label,
            String icon
    ) implements Serializable {}

    public record LocationSectionDto(
            String addressLine1,
            String addressLine2,
            String fullAddress,
            String distanceText,
            Double distanceMeters,
            String mapPreviewImageUrl,
            Double latitude,
            Double longitude,
            String googleMapsUrl
    ) implements Serializable {}

    public record ConciergeSupportDto(
            String title,
            String subtitle,
            String phone,
            String actionType
    ) implements Serializable {}

    public record SimilarPlaceCardDto(
            String id,
            String name,
            Double rating,
            String ratingText,
            String distanceLocalityCuisine,
            String offerBadge,
            String imageUrl
    ) implements Serializable {}

    public record StickyBottomBarDto(
            RewardTeaserDto rewardTeaser,
            boolean isTableBookingEnabled,
            BottomActionDto primaryAction,
            BottomActionDto secondaryAction
    ) implements Serializable {}

    public record RewardTeaserDto(
            String icon,
            String text,
            String badge
    ) implements Serializable {}

    public record BottomActionDto(
            String type,
            String label,
            String discountBadge,
            boolean enabled
    ) implements Serializable {}
}
