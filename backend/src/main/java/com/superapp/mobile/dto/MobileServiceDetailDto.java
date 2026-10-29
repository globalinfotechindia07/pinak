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
        CoinPerkBannerDto coinsPerkBanner,

        // Navigation Tabs
        List<String> availableTabs,

        // Offers & Savings Section
        OffersSectionDto offersSection,

        // Flash Sale Deals Section
        FlashSaleSectionDto flashSales,

        // Products Section (Kirana / Retail / Supermarket / Dairy Catalog)
        StoreProductsSectionDto productsSection,

        // Menu Highlights Section
        MenuHighlightsSectionDto menuSection,
        List<MenuItemDto> menuHighlights,
        List<String> menuScans,

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

    public MobileServiceDetailDto(
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
            CoinPerkBannerDto coinPerkBanner,
            List<String> availableTabs,
            OffersSectionDto offersSection,
            FlashSaleSectionDto flashSales,
            StoreProductsSectionDto productsSection,
            MenuHighlightsSectionDto menuSection,
            PhotoMosaicSectionDto photoMosaic,
            List<AmenityItemDto> amenities,
            LocationSectionDto locationSection,
            ConciergeSupportDto concierge,
            List<SimilarPlaceCardDto> similarPlaces,
            StickyBottomBarDto bottomBar
    ) {
        this(
                id, storeName, merchantName, isVerified, coverImageUrl, heroPhotos,
                totalPhotosCount, photoCounterText, distanceMeters, distanceText,
                cuisines, priceForTwoText, cuisineAndPriceText, rating, ratingCountText,
                isOpenNow, openStatusText, openingTime, closingTime, phone,
                latitude, longitude, address, googleMapsUrl,
                coinPerkBanner, coinPerkBanner,
                availableTabs, offersSection, flashSales, productsSection,
                menuSection,
                menuSection != null ? menuSection.items() : java.util.Collections.emptyList(),
                menuSection != null ? menuSection.menuImages() : java.util.Collections.emptyList(),
                photoMosaic, amenities, locationSection, concierge, similarPlaces, bottomBar
        );
    }

    public MobileServiceDetailDto(
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
            CoinPerkBannerDto coinPerkBanner,
            List<String> availableTabs,
            OffersSectionDto offersSection,
            FlashSaleSectionDto flashSales,
            MenuHighlightsSectionDto menuSection,
            PhotoMosaicSectionDto photoMosaic,
            List<AmenityItemDto> amenities,
            LocationSectionDto locationSection,
            ConciergeSupportDto concierge,
            List<SimilarPlaceCardDto> similarPlaces,
            StickyBottomBarDto bottomBar
    ) {
        this(
                id, storeName, merchantName, isVerified, coverImageUrl, heroPhotos,
                totalPhotosCount, photoCounterText, distanceMeters, distanceText,
                cuisines, priceForTwoText, cuisineAndPriceText, rating, ratingCountText,
                isOpenNow, openStatusText, openingTime, closingTime, phone,
                latitude, longitude, address, googleMapsUrl,
                coinPerkBanner,
                availableTabs, offersSection, flashSales, null,
                menuSection, photoMosaic, amenities, locationSection, concierge, similarPlaces, bottomBar
        );
    }

    public record CoinPerkBannerDto(
            String multiplier,
            String title,
            String tag,
            String badgeText
    ) implements Serializable {
        public CoinPerkBannerDto(String multiplier, String title, String tag) {
            this(multiplier, title, tag, multiplier != null ? multiplier + " BOOST" : "2X BOOST");
        }
    }

    public record OffersSectionDto(
            String activeOffersCountText,
            StoreOfferCardDto primaryOffer,
            List<StoreOfferCardDto> preBookingOffers,
            List<StoreOfferCardDto> preBookOffers,
            List<StoreOfferCardDto> walkInOffers,
            List<StoreOfferCardDto> productOffers,
            List<PartnerChipDto> partnerIncentiveChips,
            String greenPerkHighlight
    ) implements Serializable {
        public OffersSectionDto(
                String activeOffersCountText,
                StoreOfferCardDto primaryOffer,
                List<StoreOfferCardDto> preBookingOffers,
                List<StoreOfferCardDto> walkInOffers,
                List<PartnerChipDto> partnerIncentiveChips,
                String greenPerkHighlight
        ) {
            this(activeOffersCountText, primaryOffer, preBookingOffers, preBookingOffers, walkInOffers, java.util.Collections.emptyList(), partnerIncentiveChips, greenPerkHighlight);
        }

        public OffersSectionDto(
                String activeOffersCountText,
                StoreOfferCardDto primaryOffer,
                List<StoreOfferCardDto> preBookingOffers,
                List<StoreOfferCardDto> walkInOffers,
                List<StoreOfferCardDto> productOffers,
                List<PartnerChipDto> partnerIncentiveChips,
                String greenPerkHighlight
        ) {
            this(activeOffersCountText, primaryOffer, preBookingOffers, preBookingOffers, walkInOffers, productOffers != null ? productOffers : java.util.Collections.emptyList(), partnerIncentiveChips, greenPerkHighlight);
        }
    }

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
            Boolean isTableBookingEnabled,
            BigDecimal originalMrp,
            BigDecimal dealPrice,
            String offerScope,
            String imageUrl
    ) implements Serializable {
        public StoreOfferCardDto(
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
        ) {
            this(id, title, subtitle, discountType, discountValue, maxDiscountAmount, minimumOrderAmount,
                    badges, termsAndConditions, redemptionType, minAdvanceHours, ctaText, isAutoApplied,
                    bonusCoins, coverChargeAmount, minPartySize, maxPartySize, gracePeriodMinutes, slotTimes,
                    isTableBookingEnabled, null, null, "SERVICE", null);
        }
    }

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

    public record StoreProductItemDto(
            String id,
            String name,
            String brand,
            String unit,
            String imageUrl,
            BigDecimal mrp,
            BigDecimal sellingPrice,
            Integer discountPercent,
            String discountBadge,
            boolean inStock,
            String offerId
    ) implements Serializable {}

    public record StoreProductsSectionDto(
            String title,
            String subtitle,
            int totalCount,
            List<StoreProductItemDto> items
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
