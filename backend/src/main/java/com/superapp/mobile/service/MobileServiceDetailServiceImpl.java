package com.superapp.mobile.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.KycStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.mobile.dto.MobileServiceDetailDto;
import com.superapp.mobile.dto.MobileServiceDetailDto.*;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.product.entity.Product;
import com.superapp.product.repository.ProductRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.repository.StoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MobileServiceDetailServiceImpl implements MobileServiceDetailService {

    private static final Logger log = LoggerFactory.getLogger(MobileServiceDetailServiceImpl.class);

    private final StoreRepository storeRepository;
    private final MerchantRepository merchantRepository;
    private final OfferRepository offerRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    public MobileServiceDetailServiceImpl(
            StoreRepository storeRepository,
            MerchantRepository merchantRepository,
            OfferRepository offerRepository,
            ProductRepository productRepository,
            ObjectMapper objectMapper
    ) {
        this.storeRepository = storeRepository;
        this.merchantRepository = merchantRepository;
        this.offerRepository = offerRepository;
        this.productRepository = productRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public MobileServiceDetailDto getServiceDetail(UUID storeId, Double userLat, Double userLng) {
        Optional<Store> storeOpt = storeId != null ? storeRepository.findById(storeId) : Optional.empty();

        if (storeOpt.isEmpty() && storeId != null) {
            // Check if storeId is actually a merchantId
            List<Store> merchantStores = storeRepository.findByMerchantId(storeId);
            if (!merchantStores.isEmpty()) {
                storeOpt = Optional.of(merchantStores.get(0));
            }
        }

        if (storeOpt.isEmpty()) {
            throw new ResourceNotFoundException("Store not found with id: " + storeId);
        }

        Store store = storeOpt.get();

        Merchant merchant = null;
        if (store.getMerchantId() != null) {
            merchant = merchantRepository.findById(store.getMerchantId()).orElse(null);
        }

        // 1. Distance Calculation from actual store coordinates
        double storeLat = store.getLatitude() != null ? store.getLatitude().doubleValue() : 0.0;
        double storeLon = store.getLongitude() != null ? store.getLongitude().doubleValue() : 0.0;
        String locality = extractLocality(store.getAddress(), store.getState());
        String distanceText;
        double distanceMeters = 0.0;

        if (userLat != null && userLng != null && storeLat != 0.0 && storeLon != 0.0) {
            distanceMeters = calculateDistanceMeters(userLat, userLng, storeLat, storeLon);
            double distanceKm = Math.round((distanceMeters / 1000.0) * 10.0) / 10.0;
            distanceText = String.format(Locale.US, "%.1f km â€¢ %s", distanceKm, locality);
        } else {
            distanceText = locality != null && !locality.isBlank() ? locality : "In your area";
        }

        // 2. Photos & Ambiance directly from database
        List<String> photos = new ArrayList<>(store.getPhotos() != null ? store.getPhotos() : Collections.emptyList());
        if (photos.isEmpty() && store.getImageUrl() != null && !store.getImageUrl().isBlank()) {
            photos.add(store.getImageUrl());
        }
        int totalPhotos = photos.size();
        String photoCounterText = totalPhotos > 0 ? "1/" + totalPhotos : "0/0";

        String coverImageUrl = store.getImageUrl() != null && !store.getImageUrl().isBlank()
                ? store.getImageUrl()
                : (!photos.isEmpty() ? photos.get(0) : "");

        // 3. Verification & Identity directly from database
        boolean isVerified = merchant != null && (merchant.getKycStatus() == KycStatus.VERIFIED || Boolean.TRUE.equals(merchant.getIsFeatured()));
        String merchantName = merchant != null ? merchant.getBusinessName() : store.getStoreName();
        String cuisines = store.getCuisineOrCategory() != null && !store.getCuisineOrCategory().isBlank()
                ? store.getCuisineOrCategory()
                : "Dining & Treats";
        String rawPriceRange = store.getPriceRange() != null ? store.getPriceRange().trim() : "";
        String priceForTwoText;
        if ("\u20B9".equals(rawPriceRange)) {
            priceForTwoText = "\u20B9400 for two \u2022 Pocket Friendly";
        } else if ("\u20B9\u20B9".equals(rawPriceRange)) {
            priceForTwoText = "\u20B9800 for two \u2022 Moderate";
        } else if ("\u20B9\u20B9\u20B9".equals(rawPriceRange)) {
            priceForTwoText = "\u20B91,500 for two \u2022 Premium";
        } else if ("\u20B9\u20B9\u20B9\u20B9".equals(rawPriceRange)) {
            priceForTwoText = "\u20B92,500+ for two \u2022 Fine Dining";
        } else if (!rawPriceRange.isBlank()) {
            priceForTwoText = rawPriceRange.toLowerCase().contains("for two")
                    ? rawPriceRange
                    : (rawPriceRange.startsWith("\u20B9") ? rawPriceRange + " for two" : "\u20B9" + rawPriceRange + " for two");
        } else {
            priceForTwoText = "\u20B9700 for two";
        }
        String cuisineAndPriceText = !priceForTwoText.isBlank() ? cuisines + " \u2022 " + priceForTwoText : cuisines;

        Double rating = store.getRating() != null ? store.getRating().doubleValue() : 4.5;
        String ratingCountText = store.getReviewCountText() != null ? store.getReviewCountText() : "Verified Store";

        String openStatusText = store.getClosingTime() != null ? "Open till " + store.getClosingTime() : "Open Today";
        String phone = store.getPhone() != null && !store.getPhone().isBlank()
                ? store.getPhone()
                : (merchant != null && merchant.getPhone() != null ? merchant.getPhone() : "");
        String googleMapsUrl = (storeLat != 0.0 && storeLon != 0.0)
                ? String.format(Locale.US, "https://maps.google.com/?q=%.7f,%.7f", storeLat, storeLon)
                : "";

        // 4. Incentive Banner (using store/platform cashback percentage if configured)
        String cashbackText = (store.getCashbackPercentage() != null && store.getCashbackPercentage().compareTo(BigDecimal.ZERO) > 0)
                ? "Earn " + store.getCashbackPercentage() + "% PINAK Cashback Coins"
                : "Earn & Redeem 2X PINAK Coins";
        CoinPerkBannerDto coinPerkBanner = new CoinPerkBannerDto("2X", cashbackText, "AUTO-APPLY", "2X BOOST");

        // 5. Offers & Savings Section from database offers
        OffersSectionDto offersSection = buildOffersSection(store, merchant);

        // 6. Flash Sale Deals Section (strictly is_flash == true offers)
        FlashSaleSectionDto flashSales = buildFlashSaleSection(store);

        // 6b. Store Products & Retail Catalog Section (Inventory items and product deals)
        StoreProductsSectionDto productsSection = buildProductsSection(store);

        // 7. Menu Highlights Section from store.getMenuHighlights() and store.getMenuImages()
        MenuHighlightsSectionDto menuSection = buildMenuSection(store);

        // 8. Photo Mosaic Section
        PhotoMosaicSectionDto photoMosaic = buildPhotoMosaicSection(photos, coverImageUrl, totalPhotos);

        // 9. Verified Amenities Section from store.getAmenities()
        List<AmenityItemDto> amenities = buildAmenitiesSection(store);

        // 10. Similar Places Near You (queried from active stores in database)
        List<SimilarPlaceCardDto> similarPlaces = buildSimilarPlaces(store);

        // 11. Navigation Tabs (dynamically adapt to available database content)
        List<String> availableTabs = new ArrayList<>();
        availableTabs.add("Offers");
        if (productsSection != null && productsSection.items() != null && !productsSection.items().isEmpty()) {
            availableTabs.add("Products");
        }
        if ((menuSection.items() != null && !menuSection.items().isEmpty()) || (menuSection.menuImages() != null && !menuSection.menuImages().isEmpty())) {
            availableTabs.add("Menu");
        }
        if (totalPhotos > 0) {
            availableTabs.add("Photos");
        }
        if (amenities != null && !amenities.isEmpty()) {
            availableTabs.add("Amenities");
        }
        availableTabs.add("Location");
        if (similarPlaces != null && !similarPlaces.isEmpty()) {
            availableTabs.add("Similar Places");
        }

        // 11. Location Section
        LocationSectionDto locationSection = new LocationSectionDto(
                store.getAddressLine1() != null && !store.getAddressLine1().isBlank() ? store.getAddressLine1() : store.getAddress(),
                store.getAddressLine2() != null && !store.getAddressLine2().isBlank() ? store.getAddressLine2() : (store.getState() != null ? store.getState() + (store.getPincode() != null ? " " + store.getPincode() : "") : ""),
                store.getAddress(),
                distanceText,
                distanceMeters,
                (storeLat != 0.0 && storeLon != 0.0)
                        ? String.format(Locale.US, "https://staticmap.openstreetmap.de/staticmap.php?center=%.6f,%.6f&zoom=15&size=600x300&markers=%.6f,%.6f,ol-marker", storeLat, storeLon, storeLat, storeLon)
                        : "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80",
                storeLat,
                storeLon,
                googleMapsUrl
        );

        // 12. Help & Support
        ConciergeSupportDto concierge = new ConciergeSupportDto(
                "Have queries or need help booking?",
                store.getStoreName() + " Support",
                phone,
                "CALL"
        );

        // 13. Bottom Action Bar
        boolean isRetail = (store.getCuisineOrCategory() != null && (
                store.getCuisineOrCategory().toLowerCase().contains("retail") ||
                store.getCuisineOrCategory().toLowerCase().contains("cloth") ||
                store.getCuisineOrCategory().toLowerCase().contains("living") ||
                store.getCuisineOrCategory().toLowerCase().contains("grocery")
        )) || (merchantName != null && (
                merchantName.toLowerCase().contains("fab") ||
                merchantName.toLowerCase().contains("retail") ||
                merchantName.toLowerCase().contains("cloth")
        ));

        boolean hasBooking = !isRetail && offersSection.preBookingOffers() != null && !offersSection.preBookingOffers().isEmpty();
        String primaryBadge = (offersSection.primaryOffer() != null && offersSection.primaryOffer().discountValue() != null)
                ? offersSection.primaryOffer().discountValue().intValue() + "% OFF"
                : null;

        String teaserText = isRetail
                ? "Earn Coins on bill payment & retail purchases"
                : "Earn Coins on bill payment & table bookings";

        StickyBottomBarDto bottomBar = new StickyBottomBarDto(
                new RewardTeaserDto("ðŸª™", teaserText, "MAX REWARD"),
                hasBooking,
                new BottomActionDto("PAY_BILL", isRetail ? "Pay at Counter" : "Pay Bill Now", primaryBadge, true),
                new BottomActionDto(isRetail ? "EXPLORE" : "BOOK_TABLE", isRetail ? "View Products" : "Book a Table", null, true)
        );

        return new MobileServiceDetailDto(
                store.getId().toString(),
                store.getStoreName(),
                merchantName,
                isVerified,
                coverImageUrl,
                photos,
                totalPhotos,
                photoCounterText,
                distanceMeters,
                distanceText,
                cuisines,
                priceForTwoText,
                cuisineAndPriceText,
                rating,
                ratingCountText,
                true,
                openStatusText,
                store.getOpeningTime() != null ? store.getOpeningTime() : "10:00",
                store.getClosingTime() != null ? store.getClosingTime() : "23:00",
                phone,
                storeLat,
                storeLon,
                store.getAddress(),
                googleMapsUrl,
                coinPerkBanner,
                availableTabs,
                offersSection,
                flashSales,
                productsSection,
                menuSection,
                photoMosaic,
                amenities,
                locationSection,
                concierge,
                similarPlaces,
                bottomBar
        );
    }

    private OffersSectionDto buildOffersSection(Store store, Merchant merchant) {
        List<Offer> activeOffers = new ArrayList<>();
        try {
            activeOffers = offerRepository.findActiveOffersByStoreOrMerchant(
                    store.getId(),
                    merchant != null ? merchant.getId() : store.getMerchantId(),
                    Instant.now(),
                    PageRequest.of(0, 20)
            ).getContent();
        } catch (Exception e) {
            log.warn("Failed to fetch active offers from repository: {}", e.getMessage());
        }

        List<StoreOfferCardDto> preBookingOffers = new ArrayList<>();
        List<StoreOfferCardDto> walkInOffers = new ArrayList<>();
        List<StoreOfferCardDto> productOffers = new ArrayList<>();
        StoreOfferCardDto primaryOffer = null;

        for (Offer o : activeOffers) {
            boolean isProduct = "PRODUCT".equalsIgnoreCase(o.getOfferScope());
            String redemptionType = o.getRedemptionType() != null ? o.getRedemptionType() : "BOTH";
            Integer advanceHours = o.getMinAdvanceHours() != null ? o.getMinAdvanceHours() : 0;
            List<String> badges = new ArrayList<>();
            if (o.getBadgeText() != null && !o.getBadgeText().isBlank()) {
                badges.add(o.getBadgeText());
            } else {
                badges.add(isProduct ? "PRODUCT DEAL" : "PINAK Exclusive");
            }
            if (o.getValue() != null && o.getValue().compareTo(new BigDecimal("30")) >= 0) {
                badges.add("Special Deal");
            }
            badges.add("Instant");

            String subtitle;
            if (isProduct) {
                subtitle = "Original MRP \u20B9" + (o.getOriginalMrp() != null ? o.getOriginalMrp() : "0")
                        + " \u2022 Deal Price \u20B9" + (o.getFlashSellingPrice() != null ? o.getFlashSellingPrice() : (o.getValue() != null ? o.getValue() : "0"));
            } else {
                subtitle = "Valid on minimum bill \u20B9" + (o.getMinTransactionAmount() != null ? o.getMinTransactionAmount() : "0");
                if (o.getActiveDays() != null && !o.getActiveDays().isBlank()) {
                    subtitle = "Available on " + o.getActiveDays() + " \u2022 " + subtitle;
                }
            }

            BigDecimal dealPrice = o.getFlashSellingPrice() != null ? o.getFlashSellingPrice() : o.getValue();
            String cta = o.getCtaText() != null ? o.getCtaText() : (isProduct ? "Claim Deal" : "Book & Pay");

            StoreOfferCardDto card = new StoreOfferCardDto(
                    o.getId().toString(),
                    o.getTitle(),
                    subtitle,
                    o.getType() != null ? o.getType().name() : "PERCENTAGE_DISCOUNT",
                    o.getValue(),
                    o.getMaxDiscountAmount(),
                    o.getMinTransactionAmount(),
                    badges,
                    o.getTermsAndConditions() != null ? o.getTermsAndConditions() : "Auto-applied at checkout.",
                    redemptionType,
                    advanceHours,
                    cta,
                    true,
                    o.getBonusCoins(),
                    o.getCoverChargeAmount(),
                    isProduct ? 1 : o.getMinPartySize(),
                    isProduct ? 1 : o.getMaxPartySize(),
                    o.getGracePeriodMinutes(),
                    isProduct ? null : o.getSlotTimes(),
                    Boolean.TRUE.equals(o.getIsTableBookingEnabled()) && !isProduct,
                    o.getOriginalMrp(),
                    dealPrice,
                    o.getOfferScope() != null ? o.getOfferScope() : "SERVICE",
                    o.getImageUrl()
            );

            if (isProduct) {
                // Product deals strictly go into productOffers (Kirana / Retail deals)
                productOffers.add(card);
            } else {
                // Dining / Service offers go into preBooking or walkIn
                if ("PRE_BOOK".equalsIgnoreCase(redemptionType) || "BOTH".equalsIgnoreCase(redemptionType)) {
                    preBookingOffers.add(card);
                }
                if ("WALK_IN".equalsIgnoreCase(redemptionType) || "BOTH".equalsIgnoreCase(redemptionType)) {
                    walkInOffers.add(card);
                }
            }

            if (primaryOffer == null || (o.getValue() != null && primaryOffer.discountValue() != null && o.getValue().compareTo(primaryOffer.discountValue()) > 0)) {
                primaryOffer = card;
            }
        }

        if (primaryOffer == null) {
            if (!preBookingOffers.isEmpty()) primaryOffer = preBookingOffers.get(0);
            else if (!productOffers.isEmpty()) primaryOffer = productOffers.get(0);
            else if (!walkInOffers.isEmpty()) primaryOffer = walkInOffers.get(0);
        }

        int totalCount = preBookingOffers.size() + walkInOffers.size() + productOffers.size();
        String activeOffersCountText = totalCount + " Available";

        List<PartnerChipDto> partnerChips = new ArrayList<>();
        if (store.getCashbackPercentage() != null && store.getCashbackPercentage().compareTo(BigDecimal.ZERO) > 0) {
            partnerChips.add(new PartnerChipDto("chip-1", store.getCashbackPercentage() + "% Cashback", "in PINAK Coins", store.getCashbackPercentage() + "%", "COINS"));
        } else {
            partnerChips.add(new PartnerChipDto("chip-1", "20% Cashback", "in PINAK Coins", "20%", "COINS"));
        }
        partnerChips.add(new PartnerChipDto("chip-2", "Instant UPI Pay", "Zero convenience fees", "UPI", "CARD"));

        String greenPerkHighlight = "Earn Coins on all table bookings & instant UPI pay";

        return new OffersSectionDto(
                activeOffersCountText,
                primaryOffer,
                preBookingOffers,
                walkInOffers,
                productOffers,
                partnerChips,
                greenPerkHighlight
        );
    }

    private FlashSaleSectionDto buildFlashSaleSection(Store store) {
        List<FlashSaleDealDto> deals = new ArrayList<>();

        // Flash Sales: strictly query offers that the merchant explicitly created as Flash Deals (is_flash == true)
        try {
            List<Offer> flashOffers = offerRepository.findActiveOffersByStoreOrMerchant(
                    store.getId(),
                    store.getMerchantId(),
                    Instant.now(),
                    PageRequest.of(0, 10)
            ).getContent();

            for (Offer o : flashOffers) {
                if (Boolean.TRUE.equals(o.getIsFlash())) {
                    BigDecimal dealPrice = o.getFlashSellingPrice() != null ? o.getFlashSellingPrice() : o.getValue();
                    BigDecimal originalPrice = o.getOriginalMrp();
                    String badge = o.getValue() != null ? o.getValue().intValue() + "% OFF" : "Flash Deal";
                    deals.add(new FlashSaleDealDto(
                            o.getId().toString(),
                            o.getTitle(),
                            o.getImageUrl() != null && !o.getImageUrl().isBlank() ? o.getImageUrl() : store.getImageUrl(),
                            badge,
                            dealPrice,
                            originalPrice,
                            "Claim Deal"
                    ));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to query flash offers: {}", e.getMessage());
        }

        return new FlashSaleSectionDto(
                "Flash Sale Deals",
                "LIMITED",
                deals.size() > 0 ? "View all (" + deals.size() + ")" : "",
                deals
        );
    }

    private StoreProductsSectionDto buildProductsSection(Store store) {
        List<StoreProductItemDto> items = new ArrayList<>();
        java.util.Set<String> seenNames = new java.util.HashSet<>();

        // 1. Direct products from store inventory database
        try {
            List<Product> products = productRepository.findByStoreIdAndIsActiveTrue(store.getId());
            if ((products == null || products.isEmpty()) && store.getMerchantId() != null) {
                products = productRepository.findAll().stream()
                        .filter(p -> store.getMerchantId().equals(p.getMerchantId()) && Boolean.TRUE.equals(p.getIsActive()))
                        .collect(Collectors.toList());
            }

            if (products != null) {
                for (Product p : products) {
                    seenNames.add(p.getName().trim().toLowerCase());
                    int discount = p.getDiscountPercent() != null ? p.getDiscountPercent() : 0;
                    items.add(new StoreProductItemDto(
                            p.getId().toString(),
                            p.getName(),
                            p.getBrand() != null ? p.getBrand() : "Store Item",
                            p.getUnit() != null ? p.getUnit() : "1 Unit",
                            p.getImageUrl() != null && !p.getImageUrl().isBlank() ? p.getImageUrl() : store.getImageUrl(),
                            p.getMrp(),
                            p.getSellingPrice(),
                            discount,
                            discount > 0 ? discount + "% OFF" : "BEST PRICE",
                            Boolean.TRUE.equals(p.getInStock()),
                            null
                    ));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch store inventory products: {}", e.getMessage());
        }

        // 2. Product-level offers (e.g. Kirana / Supermarket / Dairy retail product deals)
        try {
            List<Offer> productOffers = offerRepository.findActiveOffersByStoreOrMerchant(
                    store.getId(),
                    store.getMerchantId(),
                    Instant.now(),
                    PageRequest.of(0, 20)
            ).getContent();

            for (Offer o : productOffers) {
                if ("PRODUCT".equalsIgnoreCase(o.getOfferScope())) {
                    String cleanName = o.getTitle();
                    if (seenNames.add(cleanName.trim().toLowerCase())) {
                        BigDecimal dealPrice = o.getFlashSellingPrice() != null ? o.getFlashSellingPrice() : o.getValue();
                        BigDecimal mrp = o.getOriginalMrp() != null ? o.getOriginalMrp() : (dealPrice != null ? dealPrice.multiply(BigDecimal.valueOf(1.2)) : BigDecimal.valueOf(70));
                        int discount = o.getValue() != null ? o.getValue().intValue() : 0;
                        items.add(new StoreProductItemDto(
                                o.getId().toString(),
                                o.getTitle(),
                                "Store Special",
                                "1 Pack",
                                o.getImageUrl() != null && !o.getImageUrl().isBlank() ? o.getImageUrl() : store.getImageUrl(),
                                mrp,
                                dealPrice != null ? dealPrice : BigDecimal.valueOf(58),
                                discount,
                                discount > 0 ? discount + "% OFF" : "SPECIAL DEAL",
                                true,
                                o.getId().toString()
                        ));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch product-scope offers: {}", e.getMessage());
        }

        return new StoreProductsSectionDto(
                "Store Products & Essentials",
                items.size() > 0 ? items.size() + " items available in store" : "Explore store catalog",
                items.size(),
                items
        );
    }

    private MenuHighlightsSectionDto buildMenuSection(Store store) {
        List<MenuItemDto> items = new ArrayList<>();
        if (store.getMenuHighlights() != null && !store.getMenuHighlights().isBlank()) {
            try {
                items = objectMapper.readValue(store.getMenuHighlights(), new TypeReference<List<MenuItemDto>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse store menuHighlights JSON: {}", e.getMessage());
            }
        }
        if (items.isEmpty() && store.getId() != null) {
            try {
                List<com.superapp.product.entity.Product> products = productRepository.findByStoreIdAndIsActiveTrue(store.getId());
                if (products != null && !products.isEmpty()) {
                    for (com.superapp.product.entity.Product p : products) {
                        items.add(new MenuItemDto(
                                p.getName(),
                                p.getDescription() != null ? p.getDescription() : p.getBrand(),
                                p.getSellingPrice() != null ? p.getSellingPrice() : p.getMrp(),
                                true,
                                p.getBrand() != null ? p.getBrand() : "Store Item"
                        ));
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to load products for store: {}", e.getMessage());
            }
        }

        List<String> menuImages = store.getMenuImages() != null && !store.getMenuImages().isEmpty()
                ? store.getMenuImages()
                : Collections.emptyList();
        int totalPages = menuImages.size();
        String menuPagesText = totalPages > 0 ? "View full menu (" + totalPages + " pages)" : "View full menu";

        return new MenuHighlightsSectionDto(
                items.isEmpty() ? "" : (store.getStoreName() != null ? store.getStoreName() + " Specialties" : "Store Specialties"),
                items,
                menuPagesText,
                totalPages,
                menuImages
        );
    }

    private PhotoMosaicSectionDto buildPhotoMosaicSection(List<String> photos, String coverImageUrl, int totalPhotos) {
        String primary = !photos.isEmpty() ? photos.get(0) : coverImageUrl;
        List<String> secondary = new ArrayList<>();
        if (photos.size() > 1) secondary.add(photos.get(1));
        if (photos.size() > 2) secondary.add(photos.get(2));

        String additionalCountText = photos.size() > 3 ? "+" + (photos.size() - 3) + " Photos" : "";

        return new PhotoMosaicSectionDto(
                primary,
                secondary,
                additionalCountText,
                totalPhotos,
                photos
        );
    }

    private List<AmenityItemDto> buildAmenitiesSection(Store store) {
        List<AmenityItemDto> result = new ArrayList<>();
        List<String> raw = store.getAmenities() != null ? new ArrayList<>(store.getAmenities()) : new ArrayList<>();

        for (String a : raw) {
            String icon = mapAmenityIcon(a);
            result.add(new AmenityItemDto(a, icon));
        }
        return result;
    }

    private String mapAmenityIcon(String label) {
        String lower = label.toLowerCase();
        if (lower.contains("bar") || lower.contains("cocktail") || lower.contains("drink")) return "martini-glass";
        if (lower.contains("park") || lower.contains("valet")) return "square-parking";
        if (lower.contains("reserv") || lower.contains("table") || lower.contains("book")) return "calendar-check";
        if (lower.contains("upi") || lower.contains("pay") || lower.contains("scan") || lower.contains("card")) return "qrcode";
        if (lower.contains("veg") || lower.contains("vegan")) return "leaf";
        if (lower.contains("ac") || lower.contains("air")) return "snowflake";
        if (lower.contains("wi-fi") || lower.contains("wifi") || lower.contains("internet")) return "wifi";
        if (lower.contains("outdoor") || lower.contains("rooftop") || lower.contains("view")) return "umbrella-beach";
        if (lower.contains("music") || lower.contains("dj")) return "music";
        return "circle-check";
    }

    private List<SimilarPlaceCardDto> buildSimilarPlaces(Store currentStore) {
        List<SimilarPlaceCardDto> list = new ArrayList<>();
        try {
            List<Store> activeStores = storeRepository.findByStatus(StoreStatus.ACTIVE, PageRequest.of(0, 5)).getContent();
            for (Store s : activeStores) {
                if (!s.getId().equals(currentStore.getId())) {
                    String img = (s.getImageUrl() != null && !s.getImageUrl().isBlank())
                            ? s.getImageUrl()
                            : (s.getPhotos() != null && !s.getPhotos().isEmpty() ? s.getPhotos().get(0) : "");
                    String ratingStr = s.getRating() != null ? String.valueOf(s.getRating()) : "4.5";
                    list.add(new SimilarPlaceCardDto(
                            s.getId().toString(),
                            s.getStoreName(),
                            s.getRating() != null ? s.getRating().doubleValue() : 4.5,
                            ratingStr,
                            s.getAddress() != null ? s.getAddress() : "",
                            s.getOpeningOffer() != null ? s.getOpeningOffer() : "Explore Deals",
                            img
                    ));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch similar stores from database: {}", e.getMessage());
        }

        return list;
    }

    private double calculateDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000;
        double latDist = Math.toRadians(lat2 - lat1);
        double lonDist = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDist / 2) * Math.sin(latDist / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDist / 2) * Math.sin(lonDist / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private String extractLocality(String address, String state) {
        if (address == null || address.isBlank()) {
            return state != null ? state : "";
        }
        String[] parts = address.split(",");
        if (parts.length >= 2) {
            String p1 = parts[parts.length - 2].trim();
            String p2 = parts[parts.length - 1].trim();
            return p1 + ", " + p2.replaceAll("[0-9]", "").trim();
        }
        return address.trim();
    }
}
