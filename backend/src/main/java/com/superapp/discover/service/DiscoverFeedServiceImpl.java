package com.superapp.discover.service;

import com.superapp.benefit.entity.DiscoverBenefit;
import com.superapp.benefit.repository.DiscoverBenefitRepository;
import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.collection.entity.PopularCollection;
import com.superapp.collection.repository.PopularCollectionRepository;
import com.superapp.discover.dto.DiscoverDtos.*;
import com.superapp.interaction.entity.UserRecentlyViewed;
import com.superapp.interaction.repository.UserRecentlyViewedRepository;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.mobile.entity.HomeBanner;
import com.superapp.mobile.repository.HomeBannerRepository;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.product.entity.Product;
import com.superapp.product.repository.ProductRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.StoreStatus;
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
    private final CategoryRepository categoryRepository;
    private final MerchantRepository merchantRepository;

    public DiscoverFeedServiceImpl(
            HomeBannerRepository homeBannerRepository,
            ProductRepository productRepository,
            PopularCollectionRepository popularCollectionRepository,
            DiscoverBenefitRepository discoverBenefitRepository,
            UserRecentlyViewedRepository userRecentlyViewedRepository,
            OfferRepository offerRepository,
            StoreRepository storeRepository,
            CategoryRepository categoryRepository,
            MerchantRepository merchantRepository) {
        this.homeBannerRepository = homeBannerRepository;
        this.productRepository = productRepository;
        this.popularCollectionRepository = popularCollectionRepository;
        this.discoverBenefitRepository = discoverBenefitRepository;
        this.userRecentlyViewedRepository = userRecentlyViewedRepository;
        this.offerRepository = offerRepository;
        this.storeRepository = storeRepository;
        this.categoryRepository = categoryRepository;
        this.merchantRepository = merchantRepository;
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
        List<ProductDealDto> dtoList = new ArrayList<>();
        Map<UUID, Store> storeMap = new HashMap<>();

        // 1. Fetch catalog Products (if any)
        List<Product> products = productRepository.findTopDeals(PageRequest.of(0, max)).getContent();
        for (Product p : products) {
            Store store = null;
            if (p.getStoreId() != null) {
                store = storeMap.computeIfAbsent(p.getStoreId(), id -> storeRepository.findById(id).orElse(null));
            }

            String storeName = store != null ? store.getStoreName() : "Partner Store";
            String distanceText = "800m";
            double distKm = 0.8;
            if (store != null && store.getLatitude() != null && store.getLongitude() != null
                    && latitude != null && longitude != null) {
                distKm = haversine(latitude, longitude,
                        store.getLatitude().doubleValue(), store.getLongitude().doubleValue());
                distanceText = distKm < 1.0 ? String.format("%dm", (int)(distKm * 1000)) : String.format("%.1f km", distKm);
            }

            if (latitude == null || longitude == null || radiusKm == null || distKm <= radiusKm) {
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
        }

        // 2. Fetch active Product Offers (created via Admin / Merchant Governance)
        List<Offer> productOffers = offerRepository.findActiveOffers(
                "PRODUCT", categoryId, Instant.now(), PageRequest.of(0, 50)
        ).getContent();

        for (Offer o : productOffers) {
            Store store = null;
            if (o.getStoreId() != null) {
                store = storeMap.computeIfAbsent(o.getStoreId(), id -> storeRepository.findById(id).orElse(null));
            } else if (o.getMerchantId() != null) {
                // Find nearest store for chain-wide offer
                List<Store> mStores = storeRepository.findByMerchantId(o.getMerchantId());
                if (!mStores.isEmpty()) {
                    if (latitude != null && longitude != null) {
                        store = mStores.stream()
                                .filter(s -> s.getLatitude() != null && s.getLongitude() != null)
                                .min(Comparator.comparingDouble(s -> haversine(latitude, longitude,
                                        s.getLatitude().doubleValue(), s.getLongitude().doubleValue())))
                                .orElse(mStores.get(0));
                    } else {
                        store = mStores.get(0);
                    }
                }
            }

            String storeName = store != null ? store.getStoreName() : "Partner Store";
            String distanceText = "0m";
            double distKm = 0.0;
            if (store != null && store.getLatitude() != null && store.getLongitude() != null
                    && latitude != null && longitude != null) {
                distKm = haversine(latitude, longitude,
                        store.getLatitude().doubleValue(), store.getLongitude().doubleValue());
                distanceText = distKm < 1.0 ? String.format("%dm", (int)(distKm * 1000)) : String.format("%.1f km", distKm);
            }

            if (latitude != null && longitude != null && radiusKm != null && distKm > radiusKm) {
                continue; // outside requested radius
            }

            Integer discountPercent = o.getValue() != null ? o.getValue().intValue() : 0;
            BigDecimal mrp = o.getOriginalMrp() != null ? o.getOriginalMrp() :
                    (o.getFlashSellingPrice() != null ? o.getFlashSellingPrice() : BigDecimal.ZERO);
            BigDecimal sellingPrice = o.getFlashSellingPrice() != null ? o.getFlashSellingPrice() : mrp;
            boolean inStock = o.getRemainingQuantity() == null || o.getRemainingQuantity() > 0;

            dtoList.add(new ProductDealDto(
                    o.getId(),
                    o.getMerchantId(),
                    storeName,
                    o.getTitle(),
                    store != null ? store.getStoreName() : null,
                    o.getDescription(),
                    o.getDescription(),
                    o.getImageUrl(),
                    mrp,
                    sellingPrice,
                    discountPercent,
                    distanceText,
                    o.getBonusCoins() != null ? o.getBonusCoins() : 50,
                    inStock
            ));
        }

        // Limit results to requested max
        if (dtoList.size() > max) {
            dtoList = dtoList.subList(0, max);
        }

        return new ProductDealsResponse(dtoList.size(), dtoList, null);
    }

    // ==========================================
    // 3. Popular Curated Collections (Dynamic from Super Admin Categories & Live Offers)
    // ==========================================
    @Override
    @Transactional(readOnly = true)
    public PopularCollectionsResponse getPopularCollections(
            Double latitude, Double longitude, Double radiusKm, String cityId, Integer limit) {

        int max = (limit != null && limit > 0) ? limit : 20;
        double radiusMeters = (radiusKm != null && radiusKm > 0) ? radiusKm * 1000.0 : 25000.0;
        Instant now = Instant.now();

        // 1. Fetch active categories configured by Super Admin
        List<Category> activeCategories = categoryRepository.findByStatusOrderByDisplayOrderAsc(CategoryStatus.ACTIVE);
        if (activeCategories.isEmpty()) {
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

        // 2. Fetch approved active stores in region
        List<Store> targetStores;
        if (latitude != null && longitude != null) {
            targetStores = storeRepository.findNearbyApprovedStores(latitude, longitude, radiusMeters, PageRequest.of(0, 100)).getContent();
            if (targetStores.isEmpty()) {
                targetStores = storeRepository.findByStatus(StoreStatus.ACTIVE, PageRequest.of(0, 100)).getContent();
            }
        } else if (cityId != null && !cityId.isBlank()) {
            targetStores = storeRepository.findAllAdmin(StoreStatus.ACTIVE, ApprovalStatus.APPROVED, cityId, PageRequest.of(0, 100)).getContent();
            if (targetStores.isEmpty()) {
                targetStores = storeRepository.findByStatus(StoreStatus.ACTIVE, PageRequest.of(0, 100)).getContent();
            }
        } else {
            targetStores = storeRepository.findByStatus(StoreStatus.ACTIVE, PageRequest.of(0, 100)).getContent();
        }

        Set<UUID> targetStoreIds = new HashSet<>();
        Set<UUID> targetMerchantIds = new HashSet<>();
        Map<UUID, List<Store>> storesByMerchant = new HashMap<>();

        for (Store s : targetStores) {
            targetStoreIds.add(s.getId());
            if (s.getMerchantId() != null) {
                targetMerchantIds.add(s.getMerchantId());
                storesByMerchant.computeIfAbsent(s.getMerchantId(), k -> new ArrayList<>()).add(s);
            }
        }

        // 3. Fetch all active approved merchants and map by category
        List<Merchant> allMerchants = merchantRepository.findAll();
        Map<UUID, Merchant> merchantMap = new HashMap<>();
        Map<UUID, List<Merchant>> merchantsByCategory = new HashMap<>();

        for (Merchant m : allMerchants) {
            merchantMap.put(m.getId(), m);
            if (m.getCategoryId() != null) {
                merchantsByCategory.computeIfAbsent(m.getCategoryId(), k -> new ArrayList<>()).add(m);
            }
        }

        // 4. Fetch live active offers
        List<Offer> activeOffers = offerRepository.findActiveOffers("ALL", null, now, PageRequest.of(0, 300)).getContent();

        // 5. Build dynamic collection card for each category
        record DynamicCollectionHolder(
                PopularCollectionItemDto dto,
                int maxDiscount,
                int storeCount,
                boolean hasLocalOffers
        ) {}

        List<DynamicCollectionHolder> holders = new ArrayList<>();

        for (Category cat : activeCategories) {
            UUID catId = cat.getId();
            List<Merchant> catMerchants = merchantsByCategory.getOrDefault(catId, Collections.emptyList());

            int storeCount = 0;
            List<String> brandNames = new ArrayList<>();
            String coverImage = null;

            for (Merchant m : catMerchants) {
                List<Store> mStores = storesByMerchant.getOrDefault(m.getId(), Collections.emptyList());
                storeCount += mStores.size();
                if (!brandNames.contains(m.getBusinessName())) {
                    brandNames.add(m.getBusinessName());
                }
                if (coverImage == null) {
                    for (Store st : mStores) {
                        if (st.getImageUrl() != null && !st.getImageUrl().isBlank()) {
                            coverImage = st.getImageUrl();
                            break;
                        }
                    }
                }
            }

            int catMaxDiscount = 0;
            Offer topOffer = null;
            int matchingOfferCount = 0;

            for (Offer o : activeOffers) {
                boolean matchesCategory = catId.equals(o.getCategoryId());
                if (!matchesCategory && o.getMerchantId() != null) {
                    Merchant m = merchantMap.get(o.getMerchantId());
                    if (m != null && catId.equals(m.getCategoryId())) {
                        matchesCategory = true;
                    }
                }

                if (!matchesCategory) continue;

                boolean matchesTargetArea = targetStoreIds.isEmpty()
                        || (o.getStoreId() != null && targetStoreIds.contains(o.getStoreId()))
                        || (o.getStoreId() == null && o.getMerchantId() != null && targetMerchantIds.contains(o.getMerchantId()));

                if (matchesTargetArea) {
                    matchingOfferCount++;
                    int val = o.getValue() != null ? o.getValue().intValue() : 0;
                    if (o.getOriginalMrp() != null && o.getFlashSellingPrice() != null
                            && o.getOriginalMrp().compareTo(BigDecimal.ZERO) > 0) {
                        int computedPct = o.getOriginalMrp().subtract(o.getFlashSellingPrice())
                                .multiply(BigDecimal.valueOf(100))
                                .divide(o.getOriginalMrp(), java.math.RoundingMode.HALF_UP)
                                .intValue();
                        if (computedPct > val) {
                            val = computedPct;
                        }
                    }
                    if (val > catMaxDiscount) {
                        catMaxDiscount = val;
                        topOffer = o;
                    }
                    if (coverImage == null && o.getImageUrl() != null && !o.getImageUrl().isBlank()) {
                        coverImage = o.getImageUrl();
                    }
                }
            }

            // Show only categories that have active stores or live offers
            if (matchingOfferCount == 0 && storeCount == 0) {
                continue;
            }

            if (coverImage == null || coverImage.isBlank()) {
                coverImage = resolveCategoryImage(cat.getName(), cat.getSlug());
            }

            // Calculate the most discounted offer for the badge text
            String badgeText;
            if (topOffer != null && catMaxDiscount > 0) {
                if (topOffer.getType() == com.superapp.offer.enums.OfferType.FIXED_DISCOUNT) {
                    badgeText = "Flat ₹" + catMaxDiscount + " OFF";
                } else if (topOffer.getType() == com.superapp.offer.enums.OfferType.CASHBACK) {
                    badgeText = "Up to ₹" + catMaxDiscount + " Cashback";
                } else {
                    badgeText = "Up to " + catMaxDiscount + "% OFF";
                }
            } else if (storeCount > 0) {
                badgeText = storeCount + (storeCount == 1 ? " Store Live" : " Stores Live");
            } else {
                badgeText = "Special Deals";
            }

            String subtitle;
            if (!brandNames.isEmpty()) {
                if (brandNames.size() == 1) {
                    subtitle = brandNames.get(0);
                } else if (brandNames.size() == 2) {
                    subtitle = brandNames.get(0) + " & " + brandNames.get(1);
                } else {
                    subtitle = brandNames.get(0) + ", " + brandNames.get(1) + " & more";
                }
            } else if (cat.getDescription() != null && !cat.getDescription().isBlank()) {
                subtitle = cat.getDescription();
            } else {
                subtitle = "Handpicked " + cat.getName() + " picks";
            }

            PopularCollectionItemDto dto = new PopularCollectionItemDto(
                    cat.getId(),
                    cat.getName(),
                    subtitle,
                    coverImage,
                    badgeText,
                    cat.getDisplayOrder(),
                    "CATEGORY",
                    cat.getId()
            );

            holders.add(new DynamicCollectionHolder(
                    dto,
                    catMaxDiscount,
                    storeCount,
                    matchingOfferCount > 0
            ));
        }

        // Sort: categories with active local offers/stores first, then highest discount, then display order
        holders.sort((a, b) -> {
            if (a.hasLocalOffers() != b.hasLocalOffers()) {
                return a.hasLocalOffers() ? -1 : 1;
            }
            if (a.storeCount() != b.storeCount()) {
                return Integer.compare(b.storeCount(), a.storeCount());
            }
            if (a.maxDiscount() != b.maxDiscount()) {
                return Integer.compare(b.maxDiscount(), a.maxDiscount());
            }
            int ordA = a.dto().displayOrder() != null ? a.dto().displayOrder() : 999;
            int ordB = b.dto().displayOrder() != null ? b.dto().displayOrder() : 999;
            return Integer.compare(ordA, ordB);
        });

        List<PopularCollectionItemDto> dtos = holders.stream()
                .map(DynamicCollectionHolder::dto)
                .limit(max)
                .toList();

        return new PopularCollectionsResponse(dtos.size(), dtos);
    }

    private String resolveCategoryImage(String name, String slug) {
        String key = ((name != null ? name : "") + " " + (slug != null ? slug : "")).toLowerCase();
        if (key.contains("din") || key.contains("restaurant") || key.contains("food")) {
            return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";
        }
        if (key.contains("cafe") || key.contains("coffee") || key.contains("bakery")) {
            return "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80";
        }
        if (key.contains("supermarket") || key.contains("grocery") || key.contains("mart")) {
            return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
        }
        if (key.contains("kirana") || key.contains("provision")) {
            return "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80";
        }
        if (key.contains("fashion") || key.contains("cloth") || key.contains("apparel")) {
            return "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80";
        }
        if (key.contains("electron") || key.contains("gadget") || key.contains("mobile")) {
            return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80";
        }
        if (key.contains("salon") || key.contains("beauty") || key.contains("spa")) {
            return "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80";
        }
        if (key.contains("gym") || key.contains("fit") || key.contains("workout")) {
            return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80";
        }
        if (key.contains("hard") || key.contains("tool")) {
            return "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80";
        }
        if (key.contains("auto") || key.contains("car") || key.contains("bike")) {
            return "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80";
        }
        return "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80";
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
    // 5. User Recently Viewed History (Multi-Entity Support & Upsert Tracking)
    // ==========================================
    @Override
    @Transactional(readOnly = true)
    public RecentlyViewedResponse getRecentlyViewed(UUID userId, Integer limit) {
        int max = (limit != null && limit > 0) ? limit : 10;
        List<UserRecentlyViewed> recent = userRecentlyViewedRepository.findRecentByUserId(userId, PageRequest.of(0, max));

        List<RecentlyViewedItemDto> dtos = new ArrayList<>();
        for (UserRecentlyViewed r : recent) {
            String title = "Special Item";
            String subtitle = "Curated Selection";
            String imageUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
            BigDecimal price = null;
            BigDecimal originalPrice = null;
            Integer discount = null;

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
            } else if ("OFFER".equalsIgnoreCase(r.getItemType())) {
                Optional<Offer> offerOpt = offerRepository.findById(r.getItemId());
                if (offerOpt.isPresent()) {
                    Offer o = offerOpt.get();
                    title = o.getTitle();
                    subtitle = o.getDescription() != null && !o.getDescription().isBlank() ? o.getDescription() : "Special Offer";
                    imageUrl = o.getImageUrl() != null ? o.getImageUrl() : imageUrl;
                    price = o.getFlashSellingPrice() != null ? o.getFlashSellingPrice() : o.getValue();
                    originalPrice = o.getOriginalMrp() != null ? o.getOriginalMrp() : price;
                    discount = o.getValue() != null ? o.getValue().intValue() : null;
                }
            } else if ("STORE".equalsIgnoreCase(r.getItemType())) {
                Optional<Store> storeOpt = storeRepository.findById(r.getItemId());
                if (storeOpt.isPresent()) {
                    Store s = storeOpt.get();
                    title = s.getStoreName();
                    subtitle = s.getAddress() != null && !s.getAddress().isBlank() ? s.getAddress() : "Store Branch";
                    imageUrl = s.getImageUrl() != null ? s.getImageUrl() : imageUrl;
                }
            } else if ("MERCHANT".equalsIgnoreCase(r.getItemType())) {
                Optional<Merchant> merchOpt = merchantRepository.findById(r.getItemId());
                if (merchOpt.isPresent()) {
                    Merchant m = merchOpt.get();
                    title = m.getBusinessName();
                    subtitle = m.getDescription() != null ? m.getDescription() : "Featured Merchant";
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
                    "Nearby",
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
        String type = (request.itemType() != null && !request.itemType().isBlank())
                ? request.itemType().toUpperCase().trim() : "PRODUCT";

        Optional<UserRecentlyViewed> existingOpt =
                userRecentlyViewedRepository.findByUserIdAndItemTypeAndItemId(userId, type, request.itemId());

        if (existingOpt.isPresent()) {
            UserRecentlyViewed existing = existingOpt.get();
            existing.setViewedAt(Instant.now());
            if (request.branchId() != null) {
                existing.setBranchId(request.branchId());
            }
            userRecentlyViewedRepository.save(existing);
        } else {
            UserRecentlyViewed record = new UserRecentlyViewed(
                    userId,
                    type,
                    request.itemId(),
                    request.branchId()
            );
            userRecentlyViewedRepository.save(record);
        }
    }

    @Override
    @Transactional
    public void clearRecentlyViewed(UUID userId) {
        if (userId != null) {
            userRecentlyViewedRepository.deleteByUserId(userId);
        }
    }

    @Override
    @Transactional
    public void removeRecentlyViewedItem(UUID userId, UUID id) {
        if (userId != null && id != null) {
            userRecentlyViewedRepository.deleteByUserIdAndId(userId, id);
        }
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
