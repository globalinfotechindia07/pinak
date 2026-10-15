package com.superapp.merchant.service;

import com.superapp.category.entity.Category;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.merchant.dto.*;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.dto.DiscoverPaginationDto;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CustomerMerchantDiscoveryServiceImpl implements CustomerMerchantDiscoveryService {

    private final MerchantRepository merchantRepository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final OfferRepository offerRepository;

    public CustomerMerchantDiscoveryServiceImpl(
            MerchantRepository merchantRepository,
            StoreRepository storeRepository,
            CategoryRepository categoryRepository,
            OfferRepository offerRepository) {
        this.merchantRepository = merchantRepository;
        this.storeRepository = storeRepository;
        this.categoryRepository = categoryRepository;
        this.offerRepository = offerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PopularMerchantsResponse getNearbyPopularMerchants(
            Double latitude, Double longitude, Double radiusKm,
            UUID categoryId, Double minRating, String sort,
            Integer limit, String cursor) {

        int limitVal = (limit != null && limit > 0 && limit <= 50) ? limit : 10;
        double radiusMeters = (radiusKm != null && radiusKm > 0 ? radiusKm : 10.0) * 1000.0;
        double minRatingVal = (minRating != null && minRating > 0) ? minRating : 4.0;

        List<Store> stores;
        if (latitude != null && longitude != null) {
            Page<Store> storePage = storeRepository.findNearbyApprovedStoresWithMinRating(
                    latitude, longitude, radiusMeters, minRatingVal, PageRequest.of(0, limitVal));
            stores = storePage.getContent();
            if (stores.isEmpty()) {
                Page<Store> fallbackPage = storeRepository.findNearbyApprovedStores(
                        latitude, longitude, radiusMeters, PageRequest.of(0, limitVal));
                stores = fallbackPage.getContent();
            }
        } else {
            Page<Store> storePage = storeRepository.findNewlyAddedApprovedStores(PageRequest.of(0, limitVal));
            stores = storePage.getContent();
        }

        List<PopularMerchantItemDto> items = new ArrayList<>();
        Instant now = Instant.now();

        for (Store s : stores) {
            Merchant m = merchantRepository.findById(s.getMerchantId()).orElse(null);
            Category cat = m != null && m.getCategoryId() != null ? categoryRepository.findById(m.getCategoryId()).orElse(null) : null;

            Integer distanceMeters = null;
            if (latitude != null && longitude != null && s.getLatitude() != null && s.getLongitude() != null) {
                distanceMeters = (int) Math.round(calculateHaversine(
                        latitude, longitude,
                        s.getLatitude().doubleValue(), s.getLongitude().doubleValue()
                ));
            }

            PopularMerchantItemDto.CategorySummaryDto catSummary = new PopularMerchantItemDto.CategorySummaryDto(
                    cat != null ? cat.getId().toString() : (s.getCityId() != null ? s.getCityId() : "general"),
                    cat != null ? cat.getName() : (s.getCuisineOrCategory() != null ? s.getCuisineOrCategory() : "Store & Services")
            );

            BigDecimal avgRating = s.getRating() != null ? s.getRating() : new BigDecimal("4.8");
            PopularMerchantItemDto.RatingSummaryDto ratingSummary = new PopularMerchantItemDto.RatingSummaryDto(
                    avgRating,
                    1200
            );

            // Fetch best offer for this store
            List<Offer> offers = offerRepository.findActiveServiceOffersByStoreIds(List.of(s.getId()), now);
            PopularMerchantItemDto.BestOfferSummaryDto bestOffer = null;
            if (!offers.isEmpty()) {
                Offer topOffer = offers.get(0);
                bestOffer = new PopularMerchantItemDto.BestOfferSummaryDto(
                        topOffer.getId().toString(),
                        topOffer.getTitle()
                );
            } else if (s.getOpeningOffer() != null && !s.getOpeningOffer().isBlank()) {
                bestOffer = new PopularMerchantItemDto.BestOfferSummaryDto("off_deal_" + s.getId().toString().substring(0, 8), s.getOpeningOffer());
            }

            PopularMerchantItemDto.BranchSummaryDto branchSummary = new PopularMerchantItemDto.BranchSummaryDto(
                    s.getId().toString(),
                    s.getStoreName()
            );

            boolean isVerified = m != null && m.getKycStatus() != null && "VERIFIED".equalsIgnoreCase(m.getKycStatus().name());

            items.add(new PopularMerchantItemDto(
                    m != null ? m.getId().toString() : s.getMerchantId().toString(),
                    m != null ? m.getBusinessName() : s.getStoreName(),
                    s.getImageUrl(),
                    s.getImageUrl(),
                    catSummary,
                    ratingSummary,
                    distanceMeters,
                    isVerified,
                    true,
                    bestOffer,
                    branchSummary,
                    false
            ));
        }

        return new PopularMerchantsResponse(items, DiscoverPaginationDto.of(limitVal, false));
    }

    @Override
    @Transactional(readOnly = true)
    public FeaturedMerchantsResponse getFeaturedMerchants(
            Double latitude, Double longitude, UUID categoryId, Integer limit, String cursor) {

        int limitVal = (limit != null && limit > 0 && limit <= 50) ? limit : 10;
        Page<Merchant> page = merchantRepository.findFeaturedMerchants(PageRequest.of(0, limitVal));
        List<Merchant> merchants = page.getContent();
        Instant now = Instant.now();

        List<FeaturedMerchantItemDto> items = new ArrayList<>();
        for (Merchant m : merchants) {
            List<Store> branches = storeRepository.findByMerchantId(m.getId());
            Store primeStore = branches.isEmpty() ? null : branches.get(0);
            Category cat = m.getCategoryId() != null ? categoryRepository.findById(m.getCategoryId()).orElse(null) : null;

            Integer distanceMeters = null;
            if (latitude != null && longitude != null && primeStore != null && primeStore.getLatitude() != null && primeStore.getLongitude() != null) {
                distanceMeters = (int) Math.round(calculateHaversine(
                        latitude, longitude,
                        primeStore.getLatitude().doubleValue(), primeStore.getLongitude().doubleValue()
                ));
            }

            BigDecimal avgRating = (primeStore != null && primeStore.getRating() != null) ? primeStore.getRating() : new BigDecimal("4.8");
            PopularMerchantItemDto.RatingSummaryDto ratingSummary = new PopularMerchantItemDto.RatingSummaryDto(
                    avgRating,
                    850
            );

            // Fetch best offer for this merchant
            List<Offer> offers = primeStore != null ? offerRepository.findActiveServiceOffersByStoreIds(List.of(primeStore.getId()), now) : List.of();
            PopularMerchantItemDto.BestOfferSummaryDto bestOffer = null;
            if (!offers.isEmpty()) {
                Offer topOffer = offers.get(0);
                bestOffer = new PopularMerchantItemDto.BestOfferSummaryDto(topOffer.getId().toString(), topOffer.getTitle());
            } else if (primeStore != null && primeStore.getOpeningOffer() != null) {
                bestOffer = new PopularMerchantItemDto.BestOfferSummaryDto("off_deal_" + primeStore.getId().toString().substring(0, 8), primeStore.getOpeningOffer());
            }

            String imgUrl = primeStore != null && primeStore.getImageUrl() != null ? primeStore.getImageUrl() : "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80";
            boolean isVerified = m.getKycStatus() != null && "VERIFIED".equalsIgnoreCase(m.getKycStatus().name());

            items.add(new FeaturedMerchantItemDto(
                    m.getId().toString(),
                    m.getBusinessName(),
                    imgUrl,
                    imgUrl,
                    cat != null ? cat.getName() : "Retail & Shopping",
                    ratingSummary,
                    distanceMeters,
                    "Featured Partner",
                    bestOffer,
                    isVerified
            ));
        }

        return new FeaturedMerchantsResponse(items, DiscoverPaginationDto.of(limitVal, false));
    }

    @Override
    @Transactional(readOnly = true)
    public NewlyAddedMerchantsResponse getNewlyAddedMerchants(
            Double latitude, Double longitude, Integer limit, String cursor) {

        int limitVal = (limit != null && limit > 0 && limit <= 50) ? limit : 10;
        Page<Store> storePage = storeRepository.findNewlyAddedApprovedStores(PageRequest.of(0, limitVal));

        List<NewlyAddedMerchantItemDto> items = new ArrayList<>();
        Instant now = Instant.now();

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

            boolean isVerified = m != null && m.getKycStatus() != null && "VERIFIED".equalsIgnoreCase(m.getKycStatus().name());
            Instant joinedAt = s.getCreatedAt() != null ? s.getCreatedAt() : now.minus(5, ChronoUnit.DAYS);
            Instant newUntil = joinedAt.plus(14, ChronoUnit.DAYS);

            PopularMerchantItemDto.BestOfferSummaryDto introOffer = null;
            if (s.getOpeningOffer() != null && !s.getOpeningOffer().isBlank()) {
                introOffer = new PopularMerchantItemDto.BestOfferSummaryDto("off_intro_" + s.getId().toString().substring(0, 8), s.getOpeningOffer());
            }

            items.add(new NewlyAddedMerchantItemDto(
                    m != null ? m.getId().toString() : s.getMerchantId().toString(),
                    m != null ? m.getBusinessName() : s.getStoreName(),
                    s.getImageUrl(),
                    cat != null ? cat.getName() : (s.getCuisineOrCategory() != null ? s.getCuisineOrCategory() : "Store"),
                    distanceMeters,
                    isVerified,
                    joinedAt,
                    newUntil,
                    introOffer
            ));
        }

        return new NewlyAddedMerchantsResponse(items, DiscoverPaginationDto.of(limitVal, false));
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
