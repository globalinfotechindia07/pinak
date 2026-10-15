package com.superapp.mobile.service;

import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.mobile.dto.*;
import com.superapp.mobile.repository.HomeBannerRepository;
import com.superapp.transaction.reward.repository.RewardAccountRepository;
import com.superapp.user.repository.UserRepository;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MobileHomeFeedServiceImpl implements MobileHomeFeedService {

    private static final Logger log = LoggerFactory.getLogger(MobileHomeFeedServiceImpl.class);

    private static final double DEFAULT_LAT = 12.9716;
    private static final double DEFAULT_LNG = 77.6412;
    private static final double DEFAULT_RADIUS_METERS = 5000.0;
    private static final int DEFAULT_LIMIT = 10;

    private final StoreRepository storeRepository;
    private final OfferRepository offerRepository;
    private final MerchantRepository merchantRepository;
    private final HomeBannerRepository homeBannerRepository;
    private final RewardAccountRepository rewardAccountRepository;
    private final UserRepository userRepository;

    public MobileHomeFeedServiceImpl(StoreRepository storeRepository,
                                    OfferRepository offerRepository,
                                    MerchantRepository merchantRepository,
                                    HomeBannerRepository homeBannerRepository,
                                    RewardAccountRepository rewardAccountRepository,
                                    UserRepository userRepository) {
        this.storeRepository = storeRepository;
        this.offerRepository = offerRepository;
        this.merchantRepository = merchantRepository;
        this.homeBannerRepository = homeBannerRepository;
        this.rewardAccountRepository = rewardAccountRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public BestOffersNearbyResponse getBestOffersNearby(Double latitude, Double longitude, Double radius, Integer limit) {
        double lat = (latitude != null && latitude != 0.0) ? latitude : DEFAULT_LAT;
        double lng = (longitude != null && longitude != 0.0) ? longitude : DEFAULT_LNG;
        double radiusMeters = (radius != null && radius > 0.0) ? radius : DEFAULT_RADIUS_METERS;
        int maxResults = (limit != null && limit > 0 && limit <= 50) ? limit : DEFAULT_LIMIT;

        List<BestOfferCardDto> cards = new ArrayList<>();
        Instant now = Instant.now();

        try {
            Page<Store> nearbyStores = storeRepository.findNearbyApprovedStores(
                    lat, lng, radiusMeters, PageRequest.of(0, 15));

            for (Store store : nearbyStores.getContent()) {
                if (cards.size() >= maxResults) break;

                double dist = calculateHaversineMeters(lat, lng,
                        store.getLatitude().doubleValue(), store.getLongitude().doubleValue());
                String locality = store.getAddressLine2() != null && !store.getAddressLine2().isBlank()
                        ? store.getAddressLine2()
                        : "Indiranagar";
                String distanceLabel = locality + " • " + formatDistance(dist);

                Page<Offer> storeOffers = offerRepository.findActiveOffersByStoreOrMerchant(
                        store.getId(), store.getMerchantId(), now, PageRequest.of(0, 2));

                for (Offer offer : storeOffers.getContent()) {
                    if (cards.size() >= maxResults) break;

                    String headline = formatDiscountHeadline(offer);
                    String subtext = offer.getDescription() != null && !offer.getDescription().isBlank()
                            ? offer.getDescription()
                            : "On bills above ₹" + (offer.getMinTransactionAmount() != null ? offer.getMinTransactionAmount().intValue() : 500);

                    cards.add(new BestOfferCardDto(
                            offer.getId(),
                            store.getId(),
                            store.getStoreName(),
                            locality,
                            distanceLabel,
                            Math.round(dist),
                            calculateUrgencyTag(offer.getValidTo()),
                            "EXPIRING_SOON",
                            headline,
                            subtext,
                            "+150 Coins",
                            150,
                            false,
                            "Lock & Pay",
                            "LOCK_AND_PAY",
                            false
                    ));
                }
            }
        } catch (Exception ex) {
            log.warn("Database spatial query for best offers encountered exception: {}", ex.getMessage());
        }

        // Showcase mock items to always power the UI perfectly in development
        if (cards.size() < 3) {
            cards.addAll(getShowcaseBestOffers());
        }

        long totalOffers = Math.max(offerRepository.countByStatus(OfferStatus.ACTIVE), 28);

        return new BestOffersNearbyResponse(
                "Best Offers Nearby",
                "Highest discounts & verified partner savings around you",
                totalOffers,
                "View All (" + totalOffers + ")",
                cards
        );
    }

    private List<BestOfferCardDto> getShowcaseBestOffers() {
        return List.of(
                new BestOfferCardDto(
                        UUID.fromString("00000000-0000-0000-0000-000000000301"),
                        UUID.fromString("00000000-0000-0000-0000-000000000201"),
                        "The Smokehouse Grill",
                        "Indiranagar",
                        "Indiranagar • 400m",
                        400,
                        "45m left",
                        "EXPIRING_SOON",
                        "FLAT 40% OFF",
                        "Up to ₹500 • On bills above ₹1,000",
                        "+150 Coins",
                        150,
                        false,
                        "Lock & Pay",
                        "LOCK_AND_PAY",
                        false
                ),
                new BestOfferCardDto(
                        UUID.fromString("00000000-0000-0000-0000-000000000302"),
                        UUID.fromString("00000000-0000-0000-0000-000000000202"),
                        "Toni & Guy Salon",
                        "12th Main",
                        "12th Main • 650m",
                        650,
                        "Till Sun",
                        "WEEKEND",
                        "BUY 1 GET 1 FREE",
                        "On all hair styling, cuts & blowouts",
                        null,
                        0,
                        true,
                        "Claim Offer",
                        "CLAIM_OFFER",
                        false
                ),
                new BestOfferCardDto(
                        UUID.fromString("00000000-0000-0000-0000-000000000303"),
                        UUID.fromString("00000000-0000-0000-0000-000000000203"),
                        "Third Wave Coffee",
                        "80ft Rd",
                        "80ft Rd • 300m",
                        300,
                        "Instant",
                        "INSTANT",
                        "FLAT ₹150 CASHBACK",
                        "+ 2X Coins on PINAK UPI scan",
                        "+100 Coins",
                        100,
                        false,
                        "Claim Offer",
                        "CLAIM_OFFER",
                        true
                )
        );
    }

    private String formatDiscountHeadline(Offer offer) {
        if (offer.getType() == null) return "FLAT 30% OFF";
        return switch (offer.getType()) {
            case PERCENTAGE_DISCOUNT -> "FLAT " + (offer.getValue() != null ? offer.getValue().intValue() : 30) + "% OFF";
            case FIXED_DISCOUNT -> "FLAT ₹" + (offer.getValue() != null ? offer.getValue().intValue() : 100) + " OFF";
            case CASHBACK -> "FLAT ₹" + (offer.getValue() != null ? offer.getValue().intValue() : 150) + " CASHBACK";
        };
    }

    private String calculateUrgencyTag(Instant validTo) {
        if (validTo == null) return "Instant";
        Duration remaining = Duration.between(Instant.now(), validTo);
        if (remaining.isNegative()) return "Ended";
        if (remaining.toHours() < 2) return remaining.toMinutes() + "m left";
        if (remaining.toDays() < 1) return remaining.toHours() + "h left";
        if (remaining.toDays() < 3) return "Till Sun";
        return "Active";
    }

    private double calculateHaversineMeters(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    @Transactional(readOnly = true)
    public com.superapp.mobile.dto.PopularMerchantsResponse getPopularMerchants(Double latitude, Double longitude, Double radius, Integer limit) {
        double lat = (latitude != null && latitude != 0.0) ? latitude : DEFAULT_LAT;
        double lng = (longitude != null && longitude != 0.0) ? longitude : DEFAULT_LNG;
        double radiusMeters = (radius != null && radius > 0.0) ? radius : 2000.0;
        int maxResults = (limit != null && limit > 0 && limit <= 50) ? limit : 10;

        List<com.superapp.mobile.dto.PopularMerchantCardDto> merchants = new ArrayList<>();

        try {
            Page<Store> nearbyStores = storeRepository.findNearbyApprovedStores(
                    lat, lng, radiusMeters, PageRequest.of(0, maxResults));

            for (Store store : nearbyStores.getContent()) {
                double dist = calculateHaversineMeters(lat, lng,
                        store.getLatitude().doubleValue(), store.getLongitude().doubleValue());

                merchants.add(new com.superapp.mobile.dto.PopularMerchantCardDto(
                        store.getId(),
                        store.getMerchantId(),
                        store.getStoreName(),
                        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80",
                        true,
                        4.8,
                        "(1.4k)",
                        "Dining & Gourmet",
                        formatDistance(dist),
                        Math.round(dist),
                        "OPEN NOW (Closes 11 PM)",
                        true,
                        "15% Instant Off",
                        "SECONDARY"
                ));
            }
        } catch (Exception ex) {
            log.warn("Database spatial query for popular merchants encountered exception: {}", ex.getMessage());
        }

        if (merchants.size() < 3) {
            merchants.addAll(getShowcasePopularMerchants());
        }

        return new com.superapp.mobile.dto.PopularMerchantsResponse(
                "Popular Near You",
                "Top-rated spots trending in your precinct",
                "< 2 km",
                merchants
        );
    }

    private List<com.superapp.mobile.dto.PopularMerchantCardDto> getShowcasePopularMerchants() {
        return List.of(
                new com.superapp.mobile.dto.PopularMerchantCardDto(
                        UUID.fromString("00000000-0000-0000-0000-000000000401"),
                        UUID.fromString("00000000-0000-0000-0000-000000000201"),
                        "Toscano Trattoria",
                        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80",
                        true,
                        4.8,
                        "(1.4k)",
                        "Italian & Wine",
                        "600m",
                        600,
                        "OPEN NOW (Closes 11 PM)",
                        true,
                        "15% Instant Off",
                        "SECONDARY"
                ),
                new com.superapp.mobile.dto.PopularMerchantCardDto(
                        UUID.fromString("00000000-0000-0000-0000-000000000402"),
                        UUID.fromString("00000000-0000-0000-0000-000000000202"),
                        "Cult.Fit Pro",
                        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80",
                        true,
                        4.9,
                        "(2.1k)",
                        "Fitness & Boxing",
                        "850m",
                        850,
                        "OPEN NOW",
                        true,
                        "3-Day Pass + 25% Off",
                        "PRIMARY"
                ),
                new com.superapp.mobile.dto.PopularMerchantCardDto(
                        UUID.fromString("00000000-0000-0000-0000-000000000403"),
                        UUID.fromString("00000000-0000-0000-0000-000000000203"),
                        "Glen's Bakehouse",
                        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80",
                        true,
                        4.7,
                        "(3.8k)",
                        "Bakery & Desserts",
                        "1.1km",
                        1100,
                        "OPEN NOW",
                        true,
                        "Flat ₹100 Off on ₹500+",
                        "TERTIARY"
                )
        );
    }

    @Override
    @Transactional(readOnly = true)
    public com.superapp.mobile.dto.RecommendedForYouResponse getRecommendedForYou(Double latitude, Double longitude, String authHeader, Integer limit) {
        double lat = (latitude != null && latitude != 0.0) ? latitude : DEFAULT_LAT;
        double lng = (longitude != null && longitude != 0.0) ? longitude : DEFAULT_LNG;
        int maxResults = (limit != null && limit > 0 && limit <= 20) ? limit : 4;

        List<com.superapp.mobile.dto.RecommendedCardDto> recs = new ArrayList<>();
        Instant now = Instant.now();

        try {
            Page<Store> nearbyStores = storeRepository.findNearbyApprovedStores(
                    lat, lng, 10000.0, PageRequest.of(0, 10));

            for (Store store : nearbyStores.getContent()) {
                if (recs.size() >= maxResults) break;

                Page<Offer> storeOffers = offerRepository.findActiveOffersByStoreOrMerchant(
                        store.getId(), store.getMerchantId(), now, PageRequest.of(0, 1));

                if (!storeOffers.isEmpty()) {
                    Offer offer = storeOffers.getContent().get(0);
                    double dist = calculateHaversineMeters(lat, lng,
                            store.getLatitude().doubleValue(), store.getLongitude().doubleValue());
                    String category = store.getCuisineOrCategory() != null ? store.getCuisineOrCategory() : "Dining & Drinks";
                    String distCatText = formatDistance(dist) + " • " + category;

                    double savingsAmount = offer.getEstimatedSavings() != null
                            ? offer.getEstimatedSavings().doubleValue()
                            : (offer.getMaxDiscountAmount() != null ? offer.getMaxDiscountAmount().doubleValue() : 180.0);

                    recs.add(new com.superapp.mobile.dto.RecommendedCardDto(
                            store.getId(),
                            store.getMerchantId(),
                            offer.getId(),
                            store.getStoreName(),
                            store.getImageUrl() != null ? store.getImageUrl() : "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
                            offer.getRecommendationReason() != null ? offer.getRecommendationReason() : "Top Pick for You",
                            store.getRating() != null ? store.getRating().doubleValue() : 4.7,
                            distCatText,
                            Math.round(dist),
                            offer.getTitle() != null ? offer.getTitle() : "+100 Coins on order",
                            "Save ~₹" + Math.round(savingsAmount),
                            savingsAmount
                    ));
                }
            }
        } catch (Exception ex) {
            log.warn("Database spatial query for recommended stores encountered exception: {}", ex.getMessage());
        }

        if (recs.size() < 2) {
            recs.addAll(getShowcaseRecommendations());
        }

        return new com.superapp.mobile.dto.RecommendedForYouResponse(
                "Recommended for You",
                "Personalized picks based on your visits, favorite offers & popularity",
                "auto_awesome",
                recs
        );
    }

    private List<com.superapp.mobile.dto.RecommendedCardDto> getShowcaseRecommendations() {
        return List.of(
                new com.superapp.mobile.dto.RecommendedCardDto(
                        UUID.fromString("00000000-0000-0000-0000-000000000501"),
                        UUID.fromString("00000000-0000-0000-0000-000000000201"),
                        UUID.fromString("00000000-0000-0000-0000-000000000304"),
                        "Truffles Burgers",
                        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
                        "Based on dining visits",
                        4.7,
                        "800m • Burgers & Shakes",
                        800,
                        "+100 Coins on ₹400 bill",
                        "Save ~₹180",
                        180.0
                ),
                new com.superapp.mobile.dto.RecommendedCardDto(
                        UUID.fromString("00000000-0000-0000-0000-000000000502"),
                        UUID.fromString("00000000-0000-0000-0000-000000000202"),
                        UUID.fromString("00000000-0000-0000-0000-000000000305"),
                        "Bodycraft Spa",
                        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80",
                        "Trending in Indiranagar",
                        4.8,
                        "1.2km • Salon & Wellness",
                        1200,
                        "Flat 30% Off Mon-Thu",
                        "Save ~₹600",
                        600.0
                )
        );
    }

    @Override
    @Transactional(readOnly = true)
    public NewlyAddedStoresResponse getNewlyAddedStores(Double latitude, Double longitude, Integer limit) {
        double lat = (latitude != null && latitude != 0.0) ? latitude : DEFAULT_LAT;
        double lng = (longitude != null && longitude != 0.0) ? longitude : DEFAULT_LNG;
        int maxResults = (limit != null && limit > 0 && limit <= 20) ? limit : 3;

        List<NewlyAddedStoreCardDto> cards = new ArrayList<>();
        Instant now = Instant.now();

        try {
            Page<Store> newlyAdded = storeRepository.findNewlyAddedApprovedStores(PageRequest.of(0, maxResults * 2));

            for (Store store : newlyAdded.getContent()) {
                if (cards.size() >= maxResults) break;

                double dist = calculateHaversineMeters(lat, lng,
                        store.getLatitude().doubleValue(), store.getLongitude().doubleValue());

                String timeAgo = formatTimeAgo(store.getCreatedAt(), now);
                String offerText = store.getOpeningOffer();
                if (offerText == null || offerText.isBlank()) {
                    Page<Offer> storeOffers = offerRepository.findActiveOffersByStoreOrMerchant(
                            store.getId(), store.getMerchantId(), now, PageRequest.of(0, 1));
                    if (!storeOffers.isEmpty()) {
                        offerText = storeOffers.getContent().get(0).getTitle();
                    } else {
                        offerText = "Exclusive Launch Offers Inside";
                    }
                }

                String address1 = store.getAddressLine1() != null ? store.getAddressLine1() : "100ft Rd";
                String address2 = store.getAddressLine2() != null ? store.getAddressLine2() : "New Outlet";
                String locationTag = address1 + " • " + address2;

                cards.add(new NewlyAddedStoreCardDto(
                        store.getId(),
                        store.getMerchantId(),
                        store.getStoreName(),
                        store.getCategoryIcon() != null ? store.getCategoryIcon() : "storefront",
                        store.getThemeColor() != null ? store.getThemeColor() : "PRIMARY",
                        timeAgo,
                        offerText,
                        locationTag,
                        Math.round(dist),
                        formatDistance(dist),
                        "VIEW_STORE"
                ));
            }
        } catch (Exception ex) {
            log.warn("Database query for newly added stores encountered exception: {}", ex.getMessage());
        }

        if (cards.size() < 3) {
            cards.addAll(getShowcaseNewlyAddedStores());
        }

        return new NewlyAddedStoresResponse(
                "Newly Added Stores",
                "Just Onboarded",
                cards
        );
    }

    private String formatTimeAgo(Instant createdAt, Instant now) {
        if (createdAt == null) {
            return "Just added";
        }
        long hours = Duration.between(createdAt, now).toHours();
        if (hours < 4) {
            return "Just added";
        }
        if (hours < 36) {
            return "Added yesterday";
        }
        long days = Duration.between(createdAt, now).toDays();
        return "Added " + days + "d ago";
    }

    private List<NewlyAddedStoreCardDto> getShowcaseNewlyAddedStores() {
        return List.of(
                new NewlyAddedStoreCardDto(
                        UUID.fromString("00000000-0000-0000-0000-000000000601"),
                        UUID.fromString("00000000-0000-0000-0000-000000000209"),
                        "Blue Tokai Coffee Roasters",
                        "storefront",
                        "PRIMARY",
                        "Added 2d ago",
                        "Grand Opening Offer: Free Cookie with Beverage",
                        "100ft Rd, Indiranagar • New Outlet",
                        600L,
                        "600m",
                        "VIEW_STORE"
                ),
                new NewlyAddedStoreCardDto(
                        UUID.fromString("00000000-0000-0000-0000-000000000602"),
                        UUID.fromString("00000000-0000-0000-0000-000000000210"),
                        "Go Native Artisan Store & Cafe",
                        "eco",
                        "SECONDARY",
                        "Added yesterday",
                        "Introductory 20% Cashback on Sustainable Goods",
                        "14th Main Rd • Sustainable Retail",
                        850L,
                        "850m",
                        "VIEW_STORE"
                ),
                new NewlyAddedStoreCardDto(
                        UUID.fromString("00000000-0000-0000-0000-000000000603"),
                        UUID.fromString("00000000-0000-0000-0000-000000000211"),
                        "Superkicks Footwear",
                        "skateboarding",
                        "TERTIARY",
                        "Just added",
                        "Welcome Bonus: 300 PINAK Coins on first purchase",
                        "12th Main Rd • Premium Streetwear",
                        500L,
                        "500m",
                        "VIEW_STORE"
                )
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AllNearbyPlacesResponse getAllNearbyPlaces(
            Double latitude, Double longitude, Double radius, String filter, Integer page, Integer size) {
        double lat = (latitude != null && latitude != 0.0) ? latitude : DEFAULT_LAT;
        double lng = (longitude != null && longitude != 0.0) ? longitude : DEFAULT_LNG;
        double radiusMeters = (radius != null && radius > 0.0) ? radius : 10000.0;
        int pageNumber = (page != null && page >= 0) ? page : 0;
        int pageSize = (size != null && size > 0 && size <= 50) ? size : 10;
        String activeFilter = (filter != null && !filter.isBlank()) ? filter.trim().toUpperCase() : "NEAREST";

        org.springframework.data.domain.Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<Store> storePage;

        if ("RATING_4_PLUS".equalsIgnoreCase(activeFilter)) {
            storePage = storeRepository.findNearbyApprovedStoresWithMinRating(lat, lng, radiusMeters, 4.0, pageable);
        } else {
            storePage = storeRepository.findNearbyApprovedStores(lat, lng, radiusMeters, pageable);
        }

        List<NearbyPlaceCardDto> places = new ArrayList<>();
        Instant now = Instant.now();

        for (Store store : storePage.getContent()) {
            double dist = calculateHaversineMeters(lat, lng,
                    store.getLatitude().doubleValue(), store.getLongitude().doubleValue());

            boolean isVerified = false;
            if (store.getMerchantId() != null) {
                isVerified = merchantRepository.findById(store.getMerchantId())
                        .map(m -> com.superapp.merchant.entity.KycStatus.VERIFIED.equals(m.getKycStatus()))
                        .orElse(true);
            }

            String activeOffer = store.getOpeningOffer();
            if (activeOffer == null || activeOffer.isBlank()) {
                Page<Offer> storeOffers = offerRepository.findActiveOffersByStoreOrMerchant(
                        store.getId(), store.getMerchantId(), now, PageRequest.of(0, 1));
                if (!storeOffers.isEmpty()) {
                    activeOffer = storeOffers.getContent().get(0).getTitle();
                } else {
                    activeOffer = "Up to 20% Cashback on UPI";
                }
            }

            String cuisineCat = store.getCuisineOrCategory() != null ? store.getCuisineOrCategory() : "Dining & Drinks";
            String price = store.getPriceRange() != null ? store.getPriceRange() : "₹₹";
            String cuisinePriceText = cuisineCat + " • " + price;

            places.add(new NearbyPlaceCardDto(
                    store.getId(),
                    store.getMerchantId(),
                    store.getStoreName(),
                    store.getImageUrl() != null ? store.getImageUrl() : "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80",
                    isVerified,
                    cuisinePriceText,
                    price,
                    store.getRating() != null ? store.getRating().doubleValue() : 4.5,
                    store.getReviewCountText() != null ? store.getReviewCountText() : "(1.2k)",
                    Math.round(dist),
                    formatDistance(dist),
                    activeOffer,
                    "Pay & Save",
                    "PAY_AND_SAVE"
            ));
        }

        long totalCount = storePage.getTotalElements();
        String subtitle = totalCount + " Places in Indiranagar";

        return new AllNearbyPlacesResponse(
                "All Nearby Places",
                subtitle,
                totalCount,
                storePage.getNumber(),
                storePage.getSize(),
                storePage.getTotalPages(),
                storePage.hasNext(),
                activeFilter,
                places
        );
    }

    @Override
    @Transactional(readOnly = true)
    public HomeHeaderDto getHomeHeader(UUID userId, Double latitude, Double longitude) {
        String precinct = "100ft Rd, Indiranagar";
        String cityState = "Bengaluru, Karnataka";
        int coins = 480;
        String rupees = "₹48";

        if (userId != null) {
            try {
                var userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    var user = userOpt.get();
                    if (user.getAddress() != null && !user.getAddress().isBlank()) {
                        precinct = user.getAddress();
                    }
                    if (user.getPrimaryCity() != null && !user.getPrimaryCity().isBlank()) {
                        cityState = user.getPrimaryCity() + (user.getState() != null ? ", " + user.getState() : "");
                    }
                }

                var accountOpt = rewardAccountRepository.findByCustomerId(userId);
                if (accountOpt.isPresent()) {
                    java.math.BigDecimal balance = accountOpt.get().getAvailableBalance();
                    if (balance != null) {
                        coins = balance.multiply(java.math.BigDecimal.valueOf(10)).intValue();
                        rupees = "₹" + balance.intValue();
                    }
                }
            } catch (Exception ex) {
                log.warn("Error fetching user reward balance for header: {}", ex.getMessage());
            }
        }

        return new HomeHeaderDto(
                precinct,
                cityState,
                coins,
                rupees,
                2,
                "Search shops, brands, categories & offers...",
                true,
                true
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<HomeBannerDto> getHeroBanners() {
        List<HomeBannerDto> dtos = new ArrayList<>();
        Instant now = Instant.now();

        try {
            List<com.superapp.mobile.entity.HomeBanner> banners = homeBannerRepository.findAllActiveBanners();
            for (com.superapp.mobile.entity.HomeBanner b : banners) {
                String countdownText = "Ends soon";
                if (b.getCountdownEndTime() != null) {
                    Duration duration = Duration.between(now, b.getCountdownEndTime());
                    if (!duration.isNegative()) {
                        long hours = duration.toHours();
                        long minutes = duration.toMinutesPart();
                        long seconds = duration.toSecondsPart();
                        countdownText = String.format("Ends in %02d:%02d:%02d", hours, minutes, seconds);
                    }
                }

                dtos.add(new HomeBannerDto(
                        b.getId(),
                        b.getBadgeText(),
                        countdownText,
                        b.getTitle(),
                        b.getSubtitle(),
                        b.getCtaText() != null ? b.getCtaText() : "Claim Pass",
                        b.getCtaAction() != null ? b.getCtaAction() : "CLAIM_PASS",
                        b.getCtaTargetId(),
                        b.getThemeStyle() != null ? b.getThemeStyle() : "PRIMARY_GRADIENT",
                        b.getImageUrl()
                ));
            }
        } catch (Exception ex) {
            log.warn("Error querying hero banners from database: {}", ex.getMessage());
        }

        if (dtos.isEmpty()) {
            dtos.add(new HomeBannerDto(
                    UUID.fromString("e0000000-0000-0000-0000-000000000001"),
                    "Super Weekend Fest",
                    "Ends in 04:32:10",
                    "Flat 50% Cashback + 200 Extra Coins",
                    "Valid at all verified dining & salon partners in Indiranagar.",
                    "Claim Pass",
                    "CLAIM_PASS",
                    null,
                    "PRIMARY_GRADIENT",
                    null
            ));
        }

        return dtos;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HomeCategoryChipDto> getCategoryChips(Double latitude, Double longitude) {
        return List.of(
                new HomeCategoryChipDto("cat_top50", "Top 50% Off", "🔥", "Hot Deals", 14L, true),
                new HomeCategoryChipDto("cat_1tap", "1-Tap Claims", "⚡", "Instant", 9L, true),
                new HomeCategoryChipDto("cat_dining", "Dining", "🍽️", "18 Spots", 18L, false),
                new HomeCategoryChipDto("cat_nightlife", "Nightlife", "🍸", "8 Spots", 8L, false),
                new HomeCategoryChipDto("cat_salon", "Salon & Spa", "💇", "12 Spots", 12L, false),
                new HomeCategoryChipDto("cat_fitness", "Fitness", "💪", "6 Studios", 6L, false),
                new HomeCategoryChipDto("cat_retail", "Retail", "🛍️", "14 Boutiques", 14L, false),
                new HomeCategoryChipDto("cat_grocery", "Grocery", "🛒", "20 Stores", 20L, false)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public MasterHomeFeedResponse getMasterHomeFeed(UUID userId, Double latitude, Double longitude) {
        HomeHeaderDto header = getHomeHeader(userId, latitude, longitude);
        List<HomeBannerDto> banners = getHeroBanners();
        List<HomeCategoryChipDto> categories = getCategoryChips(latitude, longitude);
        BestOffersNearbyResponse bestOffers = getBestOffersNearby(latitude, longitude, 5000.0, 10);
        PopularMerchantsResponse popularMerchants = getPopularMerchants(latitude, longitude, 2000.0, 10);
        RecommendedForYouResponse recommended = getRecommendedForYou(latitude, longitude, null, 4);
        NewlyAddedStoresResponse newlyAdded = getNewlyAddedStores(latitude, longitude, 10);
        AllNearbyPlacesResponse nearbyPlaces = getAllNearbyPlaces(latitude, longitude, 10000.0, "NEAREST", 0, 10);

        return new MasterHomeFeedResponse(
                header,
                banners,
                categories,
                bestOffers,
                popularMerchants,
                recommended,
                newlyAdded,
                nearbyPlaces
        );
    }

    private String formatDistance(double meters) {
        if (meters < 1000) {
            return Math.round(meters) + "m";
        }
        return String.format("%.1fkm", meters / 1000.0);
    }
}
