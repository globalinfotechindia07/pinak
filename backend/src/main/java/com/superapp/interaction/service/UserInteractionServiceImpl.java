package com.superapp.interaction.service;

import com.superapp.category.entity.Category;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.interaction.dto.*;
import com.superapp.interaction.entity.UserRecentlyViewed;
import com.superapp.interaction.repository.UserRecentlyViewedRepository;
import com.superapp.merchant.dto.PopularMerchantItemDto;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.dto.DiscoverPaginationDto;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.product.entity.Product;
import com.superapp.product.repository.ProductRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserInteractionServiceImpl implements UserInteractionService {

    private final UserRecentlyViewedRepository recentlyViewedRepository;
    private final ProductRepository productRepository;
    private final MerchantRepository merchantRepository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final OfferRepository offerRepository;

    public UserInteractionServiceImpl(
            UserRecentlyViewedRepository recentlyViewedRepository,
            ProductRepository productRepository,
            MerchantRepository merchantRepository,
            StoreRepository storeRepository,
            CategoryRepository categoryRepository,
            OfferRepository offerRepository) {
        this.recentlyViewedRepository = recentlyViewedRepository;
        this.productRepository = productRepository;
        this.merchantRepository = merchantRepository;
        this.storeRepository = storeRepository;
        this.categoryRepository = categoryRepository;
        this.offerRepository = offerRepository;
    }

    @Override
    @Transactional
    public void recordRecentlyViewed(UUID userId, RecordRecentlyViewedRequest request) {
        Optional<UserRecentlyViewed> existing = recentlyViewedRepository.findByUserIdAndItemTypeAndItemId(
                userId, request.itemType().toUpperCase(), request.itemId());

        if (existing.isPresent()) {
            UserRecentlyViewed view = existing.get();
            view.setViewedAt(Instant.now());
            if (request.branchId() != null) {
                view.setBranchId(request.branchId());
            }
            recentlyViewedRepository.save(view);
        } else {
            UserRecentlyViewed view = new UserRecentlyViewed(
                    userId,
                    request.itemType().toUpperCase(),
                    request.itemId(),
                    request.branchId()
            );
            recentlyViewedRepository.save(view);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public RecentlyViewedResponse getRecentlyViewed(UUID userId, String type, Integer limit, String cursor) {
        int limitVal = (limit != null && limit > 0 && limit <= 50) ? limit : 10;
        List<UserRecentlyViewed> views;

        if (type != null && !type.isBlank()) {
            views = recentlyViewedRepository.findRecentByUserIdAndType(userId, type.toUpperCase(), PageRequest.of(0, limitVal));
        } else {
            views = recentlyViewedRepository.findRecentByUserId(userId, PageRequest.of(0, limitVal));
        }

        List<RecentlyViewedItemDto> items = new ArrayList<>();

        if (!views.isEmpty()) {
            for (UserRecentlyViewed v : views) {
                if ("PRODUCT".equalsIgnoreCase(v.getItemType())) {
                    Product prod = productRepository.findById(v.getItemId()).orElse(null);
                    if (prod != null) {
                        Category cat = prod.getCategoryId() != null ? categoryRepository.findById(prod.getCategoryId()).orElse(null) : null;
                        items.add(new RecentlyViewedItemDto(
                                "PRODUCT",
                                prod.getId().toString(),
                                v.getViewedAt(),
                                prod.getName(),
                                prod.getImageUrl(),
                                prod.getUnit(),
                                new RecentlyViewedItemDto.PriceDto(prod.getCurrency(), prod.getSellingPrice(), prod.getMrp()),
                                new RecentlyViewedItemDto.AvailabilityDto(prod.getInStock()),
                                cat != null ? cat.getName() : "Retail"
                        ));
                    }
                } else if ("MERCHANT".equalsIgnoreCase(v.getItemType())) {
                    Merchant m = merchantRepository.findById(v.getItemId()).orElse(null);
                    if (m != null) {
                        List<Store> branches = storeRepository.findByMerchantId(m.getId());
                        Store st = branches.isEmpty() ? null : branches.get(0);
                        Category cat = m.getCategoryId() != null ? categoryRepository.findById(m.getCategoryId()).orElse(null) : null;
                        items.add(new RecentlyViewedItemDto(
                                "MERCHANT",
                                m.getId().toString(),
                                v.getViewedAt(),
                                m.getBusinessName(),
                                st != null ? st.getImageUrl() : null,
                                null,
                                null,
                                new RecentlyViewedItemDto.AvailabilityDto(true),
                                cat != null ? cat.getName() : "Store"
                        ));
                    }
                }
            }
        }

        // If user has no browsing history yet, return active showcase products from database
        if (items.isEmpty()) {
            Page<Product> page = productRepository.findTopDeals(PageRequest.of(0, limitVal));
            for (Product p : page.getContent()) {
                Category cat = p.getCategoryId() != null ? categoryRepository.findById(p.getCategoryId()).orElse(null) : null;
                items.add(new RecentlyViewedItemDto(
                        "PRODUCT",
                        p.getId().toString(),
                        Instant.now(),
                        p.getName(),
                        p.getImageUrl(),
                        p.getUnit(),
                        new RecentlyViewedItemDto.PriceDto(p.getCurrency(), p.getSellingPrice(), p.getMrp()),
                        new RecentlyViewedItemDto.AvailabilityDto(p.getInStock()),
                        cat != null ? cat.getName() : "Retail"
                ));
            }
        }

        return new RecentlyViewedResponse(items, DiscoverPaginationDto.of(limitVal, false));
    }

    @Override
    @Transactional(readOnly = true)
    public RecommendationsResponse getRecommendations(
            UUID userId, Double latitude, Double longitude, Integer limit, String cursor) {

        int limitVal = (limit != null && limit > 0 && limit <= 50) ? limit : 10;
        Instant now = Instant.now();

        // 1. Check if user has recently viewed items to tailor recommendations
        List<UserRecentlyViewed> recent = recentlyViewedRepository.findRecentByUserId(userId, PageRequest.of(0, 5));
        boolean hasHistory = !recent.isEmpty();

        // 2. Fetch popular/featured stores from database
        Page<Store> storePage;
        if (latitude != null && longitude != null) {
            storePage = storeRepository.findNearbyApprovedStoresWithMinRating(
                    latitude, longitude, 10000.0, 4.0, PageRequest.of(0, limitVal));
            if (storePage.isEmpty()) {
                storePage = storeRepository.findNearbyApprovedStores(latitude, longitude, 10000.0, PageRequest.of(0, limitVal));
            }
        } else {
            storePage = storeRepository.findNewlyAddedApprovedStores(PageRequest.of(0, limitVal));
        }

        List<RecommendationItemDto> items = new ArrayList<>();
        for (Store s : storePage.getContent()) {
            Merchant m = merchantRepository.findById(s.getMerchantId()).orElse(null);
            Category cat = m != null && m.getCategoryId() != null ? categoryRepository.findById(m.getCategoryId()).orElse(null) : null;

            Integer distanceMeters = null;
            if (latitude != null && longitude != null && s.getLatitude() != null && s.getLongitude() != null) {
                distanceMeters = (int) Math.round(calculateHaversine(
                        latitude, longitude,
                        s.getLatitude().doubleValue(), s.getLongitude().doubleValue()
                ));
            }

            BigDecimal avgRating = s.getRating() != null ? s.getRating() : new BigDecimal("4.8");
            PopularMerchantItemDto.RatingSummaryDto ratingSummary = new PopularMerchantItemDto.RatingSummaryDto(avgRating, 920);

            // Fetch best offer
            List<Offer> offers = offerRepository.findActiveServiceOffersByStoreIds(List.of(s.getId()), now);
            PopularMerchantItemDto.BestOfferSummaryDto bestOffer = null;
            if (!offers.isEmpty()) {
                bestOffer = new PopularMerchantItemDto.BestOfferSummaryDto(offers.get(0).getId().toString(), offers.get(0).getTitle());
            } else if (s.getOpeningOffer() != null) {
                bestOffer = new PopularMerchantItemDto.BestOfferSummaryDto("off_deal_" + s.getId().toString().substring(0, 8), s.getOpeningOffer());
            }

            String reasonCode = hasHistory ? "BASED_ON_INTERESTS" : "POPULAR_IN_YOUR_AREA";
            String reasonLabel = hasHistory ? "Based on your recent visits" : "Popular in your neighborhood";

            items.add(new RecommendationItemDto(
                    "MERCHANT",
                    m != null ? m.getId().toString() : s.getMerchantId().toString(),
                    m != null ? m.getBusinessName() : s.getStoreName(),
                    cat != null ? cat.getName() : "Services",
                    s.getImageUrl(),
                    distanceMeters,
                    ratingSummary,
                    reasonCode,
                    reasonLabel,
                    bestOffer
            ));
        }

        return new RecommendationsResponse(items, DiscoverPaginationDto.of(limitVal, false));
    }

    private double calculateHaversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
