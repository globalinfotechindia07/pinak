package com.superapp.discover.service;

import com.superapp.benefit.entity.DiscoverBenefit;
import com.superapp.benefit.repository.DiscoverBenefitRepository;
import com.superapp.collection.entity.PopularCollection;
import com.superapp.collection.repository.PopularCollectionRepository;
import com.superapp.discover.dto.DiscoverDtos.*;
import com.superapp.interaction.entity.UserRecentlyViewed;
import com.superapp.interaction.repository.UserRecentlyViewedRepository;
import com.superapp.mobile.entity.HomeBanner;
import com.superapp.mobile.repository.HomeBannerRepository;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.product.entity.Product;
import com.superapp.product.repository.ProductRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
public class DiscoverFeedServiceImpl implements DiscoverFeedService {

    private final HomeBannerRepository homeBannerRepository;
    private final ProductRepository productRepository;
    private final PopularCollectionRepository popularCollectionRepository;
    private final DiscoverBenefitRepository discoverBenefitRepository;
    private final UserRecentlyViewedRepository userRecentlyViewedRepository;
    private final OfferRepository offerRepository;
    private final StoreRepository storeRepository;

    public DiscoverFeedServiceImpl(
            HomeBannerRepository homeBannerRepository,
            ProductRepository productRepository,
            PopularCollectionRepository popularCollectionRepository,
            DiscoverBenefitRepository discoverBenefitRepository,
            UserRecentlyViewedRepository userRecentlyViewedRepository,
            OfferRepository offerRepository,
            StoreRepository storeRepository) {
        this.homeBannerRepository = homeBannerRepository;
        this.productRepository = productRepository;
        this.popularCollectionRepository = popularCollectionRepository;
        this.discoverBenefitRepository = discoverBenefitRepository;
        this.userRecentlyViewedRepository = userRecentlyViewedRepository;
        this.offerRepository = offerRepository;
        this.storeRepository = storeRepository;
    }

    // ==========================================
    // 1. Promotional Banners (Screen 10 Hero)
    // ==========================================
    @Override
    @Transactional(readOnly = true)
    public BannersResponse getBanners(String placement, Double latitude, Double longitude) {
        List<HomeBanner> banners = homeBannerRepository.findAllActiveBanners();
        List<BannerItemDto> items = new ArrayList<>();

        for (HomeBanner b : banners) {
            String idStr = b.getId() != null ? b.getId().toString() : null;
            String actionType = b.getCtaAction() != null ? b.getCtaAction() : "CAMPAIGN";
            String actionId = b.getCtaTargetId() != null ? b.getCtaTargetId() : ("cmp_" + (idStr != null ? idStr.substring(0, 8) : "1001"));
            String deeplink = "pinak://" + actionType.toLowerCase().replace("_", "-") + "/" + actionId;

            String bgColor = switch (b.getThemeStyle() != null ? b.getThemeStyle() : "") {
                case "SECONDARY_GRADIENT" -> "#1E1B4B";
                case "TERTIARY_GRADIENT" -> "#0F172A";
                default -> "#5B21B6";
            };

            items.add(new BannerItemDto(
                    idStr,
                    b.getTitle(),
                    b.getSubtitle(),
                    b.getSubtitle() != null ? b.getSubtitle() : "Exclusive PINAK promotional benefits",
                    b.getImageUrl(),
                    bgColor,
                    b.getBadgeText() != null ? b.getBadgeText().toUpperCase() : "FEATURED",
                    b.getCtaText() != null ? b.getCtaText() : "Explore Offers",
                    actionType,
                    actionId,
                    deeplink,
                    b.getDisplayOrder() != null ? b.getDisplayOrder() : 0,
                    b.getCreatedAt() != null ? b.getCreatedAt() : Instant.now(),
                    b.getCountdownEndTime()
            ));
        }

        return new BannersResponse(items);
    }

    // ==========================================
    // 2. Retail Product Deals Near You
    // ==========================================
    @Override
    @Transactional(readOnly = true)
    public ProductDealsResponse getNearbyProductDeals(
            Double latitude, Double longitude, Double radiusKm,
            UUID categoryId, Integer limit, String cursor) {

        int max = (limit != null && limit > 0 && limit <= 50) ? limit : 10;
        List<Product> products = productRepository.findTopDeals(PageRequest.of(0, max)).getContent();

        // Fetch stores to resolve branch distance and store names
        Map<UUID, Store> storeMap = new HashMap<>();
        List<ProductDealDto> dtoList = new ArrayList<>();

        for (Product p : products) {
            Store store = null;
            if (p.getStoreId() != null) {
                store = storeMap.computeIfAbsent(p.getStoreId(), id -> storeRepository.findById(id).orElse(null));
            }

            String storeName = store != null ? store.getStoreName() : "Partner Store";
            String distanceText = "800m";
            if (store != null && store.getLatitude() != null && store.getLongitude() != null
                    && latitude != null && longitude != null) {
                double distKm = haversine(latitude, longitude,
                        store.getLatitude().doubleValue(), store.getLongitude().doubleValue());
                distanceText = distKm < 1.0 ? String.format("%dm", (int)(distKm * 1000)) : String.format("%.1f km", distKm);
            }

            dtoList.add(new ProductDealDto(
                    p.getId(),
                    p.getMerchantId(),
                    storeName,
                    p.getName(),
                    p.getBrand(),
                    p.getUnit(),
                    p.getDescription(),
                    p.getImageUrl(),
                    p.getMrp(),
                    p.getSellingPrice(),
                    p.getDiscountPercent(),
                    distanceText,
                    50,
                    p.getInStock()
            ));
        }

        return new ProductDealsResponse(dtoList.size(), dtoList, null);
    }

    // ==========================================
    // 3. Popular Curated Collections
    // ==========================================
    @Override
    @Transactional(readOnly = true)
    public PopularCollectionsResponse getPopularCollections(Integer limit) {
        int max = (limit != null && limit > 0) ? limit : 20;
        List<PopularCollection> list = popularCollectionRepository.findActiveCollections(PageRequest.of(0, max));

        List<PopularCollectionItemDto> dtos = list.stream()
                .map(c -> new PopularCollectionItemDto(
                        c.getId(),
                        c.getTitle(),
                        c.getSubtitle(),
                        c.getCoverImageUrl(),
                        c.getBadgeText(),
                        c.getDisplayOrder(),
                        c.getTargetType(),
                        c.getTargetId()
                )).toList();

        return new PopularCollectionsResponse(dtos.size(), dtos);
    }

    // ==========================================
    // 4. Discover Platform Benefits
    // ==========================================
    @Override
    @Transactional(readOnly = true)
    public DiscoverBenefitsResponse getActiveBenefits() {
        List<DiscoverBenefit> list = discoverBenefitRepository.findActiveBenefits();
        List<DiscoverBenefitItemDto> dtos = list.stream()
                .map(b -> new DiscoverBenefitItemDto(
                        b.getId(),
                        b.getTitle(),
                        b.getSubtitle(),
                        b.getIconName(),
                        b.getDisplayOrder()
                )).toList();

        return new DiscoverBenefitsResponse(dtos.size(), dtos);
    }

    // ==========================================
    // 5. User Recently Viewed History
    // ==========================================
    @Override
    @Transactional(readOnly = true)
    public RecentlyViewedResponse getRecentlyViewed(UUID userId, Integer limit) {
        int max = (limit != null && limit > 0) ? limit : 10;
        List<UserRecentlyViewed> recent = userRecentlyViewedRepository.findRecentByUserId(userId, PageRequest.of(0, max));

        List<RecentlyViewedItemDto> dtos = new ArrayList<>();
        for (UserRecentlyViewed r : recent) {
            String title = "Amul Fresh Milk";
            String subtitle = "1 Litre";
            String imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuD_2XWCwUR-vNhnMYRogZE5BxOHD5tvFlIBEroQwTtHW3782cxy3J_gj1vQTpSKBJdMvqjy8uGwEfKsoub8Bz6B8zfkWU010CQQBmjfTVf3Q8UBUn6ZDjBFmV3VcD_86Hefg9c320lIlYsgoSCNfrJStXvebXbHLAj99C3p95gcc1NhXnR7X95qHgvmTGMAvTrjPA_nWw1AbqYLLRn7yA5-zw3SnXA0sQe1GsvonrO_tei27BYpopNq";
            BigDecimal price = new BigDecimal("52.00");
            BigDecimal originalPrice = new BigDecimal("65.00");
            Integer discount = 20;

            if ("PRODUCT".equalsIgnoreCase(r.getItemType())) {
                Optional<Product> prodOpt = productRepository.findById(r.getItemId());
                if (prodOpt.isPresent()) {
                    Product p = prodOpt.get();
                    title = p.getName();
                    subtitle = p.getUnit();
                    imageUrl = p.getImageUrl();
                    price = p.getSellingPrice();
                    originalPrice = p.getMrp();
                    discount = p.getDiscountPercent();
                }
            }

            dtos.add(new RecentlyViewedItemDto(
                    r.getId(),
                    r.getItemType(),
                    r.getItemId(),
                    title,
                    subtitle,
                    imageUrl,
                    price,
                    originalPrice,
                    discount,
                    "800m",
                    r.getViewedAt()
            ));
        }

        return new RecentlyViewedResponse(dtos.size(), dtos);
    }

    @Override
    @Transactional
    public void recordRecentlyViewed(UUID userId, RecordRecentlyViewedRequest request) {
        if (request == null || request.itemId() == null) {
            return;
        }
        UserRecentlyViewed record = new UserRecentlyViewed(
                userId,
                request.itemType() != null && !request.itemType().isBlank() ? request.itemType() : "PRODUCT",
                request.itemId(),
                request.branchId()
        );
        userRecentlyViewedRepository.save(record);
    }

    // ==========================================
    // 6. Personalized Recommendations
    // ==========================================
    @Override
    @Transactional(readOnly = true)
    public RecommendationsResponse getPersonalizedRecommendations(
            UUID userId, Double latitude, Double longitude, Integer limit) {

        int max = (limit != null && limit > 0) ? limit : 10;
        List<Offer> activeOffers = offerRepository.findActiveServiceOffers(null, Instant.now(), PageRequest.of(0, max)).getContent();

        List<RecommendationItemDto> dtos = new ArrayList<>();
        for (Offer o : activeOffers) {
            if (dtos.size() >= max) break;
            if (Boolean.TRUE.equals(o.getIsFlash())) continue; // Flash deals handled in dedicated flash grid

            Store store = o.getStoreId() != null ? storeRepository.findById(o.getStoreId()).orElse(null) : null;
            String storeName = store != null ? store.getStoreName() : o.getTitle();
            String distanceText = "800m";
            if (store != null && store.getLatitude() != null && store.getLongitude() != null
                    && latitude != null && longitude != null) {
                double distKm = haversine(latitude, longitude,
                        store.getLatitude().doubleValue(), store.getLongitude().doubleValue());
                distanceText = distKm < 1.0 ? String.format("%dm", (int)(distKm * 1000)) : String.format("%.1f km", distKm);
            }

            String reason = o.getRecommendationReason() != null ? o.getRecommendationReason() : "Based on your interests";
            String discountText = o.getTitle() != null ? o.getTitle() : "Special Discount";
            String cta = o.getCtaText() != null ? o.getCtaText() : "Claim Offer";

            dtos.add(new RecommendationItemDto(
                    o.getId(),
                    "OFFER",
                    o.getStoreId(),
                    storeName,
                    distanceText + " • " + (store != null && store.getCuisineOrCategory() != null ? store.getCuisineOrCategory() : "Trending Spot"),
                    o.getImageUrl() != null ? o.getImageUrl() : (store != null ? store.getImageUrl() : null),
                    o.getBadgeText() != null ? o.getBadgeText() : "Trending near you",
                    reason,
                    discountText,
                    distanceText,
                    cta
            ));
        }

        return new RecommendationsResponse(dtos.size(), dtos);
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
