package com.superapp.search.service;

import com.superapp.category.entity.Category;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.search.dto.SearchSuggestionItemDto;
import com.superapp.search.dto.SearchSuggestionsResponse;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class SearchServiceImpl implements SearchService {

    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final OfferRepository offerRepository;

    public SearchServiceImpl(
            StoreRepository storeRepository,
            CategoryRepository categoryRepository,
            OfferRepository offerRepository) {
        this.storeRepository = storeRepository;
        this.categoryRepository = categoryRepository;
        this.offerRepository = offerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public SearchSuggestionsResponse getSuggestions(String query, Double latitude, Double longitude, Integer limit) {
        if (query == null || query.isBlank()) {
            return new SearchSuggestionsResponse("", List.of());
        }

        String q = query.trim();
        int maxLimit = (limit != null && limit > 0 && limit <= 50) ? limit : 10;
        List<SearchSuggestionItemDto> items = new ArrayList<>();

        // 1. Search Stores from PostgreSQL stores table
        try {
            List<Store> stores = storeRepository.searchActiveStores(q, PageRequest.of(0, maxLimit));
            for (Store store : stores) {
                if (items.size() >= maxLimit) break;
                String subtitle = store.getCuisineOrCategory() != null ? store.getCuisineOrCategory() : "Store";
                if (latitude != null && longitude != null && store.getLatitude() != null && store.getLongitude() != null) {
                    double distMeters = calculateHaversineDistance(
                            latitude, longitude,
                            store.getLatitude().doubleValue(), store.getLongitude().doubleValue()
                    );
                    String distStr = distMeters < 1000
                            ? Math.round(distMeters) + " m away"
                            : String.format("%.1f km away", distMeters / 1000.0);
                    subtitle = subtitle + " • " + distStr;
                } else if (store.getAddress() != null) {
                    subtitle = subtitle + " • " + store.getAddress();
                }

                items.add(new SearchSuggestionItemDto(
                        "MERCHANT",
                        store.getId() != null ? store.getId().toString() : null,
                        store.getStoreName(),
                        subtitle,
                        store.getImageUrl()
                ));
            }
        } catch (Exception ignored) {
        }

        // 2. Search Categories from PostgreSQL categories table
        if (items.size() < maxLimit) {
            try {
                List<Category> categories = categoryRepository.searchActiveCategories(q, PageRequest.of(0, maxLimit - items.size()));
                for (Category category : categories) {
                    if (items.size() >= maxLimit) break;
                    String parentName = category.getParent() != null ? category.getParent().getName() : "Category";
                    items.add(new SearchSuggestionItemDto(
                            "CATEGORY",
                            category.getId() != null ? category.getId().toString() : null,
                            category.getName(),
                            parentName + " • Explore shops & deals",
                            category.getIcon()
                    ));
                }
            } catch (Exception ignored) {
            }
        }

        // 3. Search Offers from PostgreSQL offers table
        if (items.size() < maxLimit) {
            try {
                List<Offer> offers = offerRepository.searchActiveOffers(q, Instant.now(), PageRequest.of(0, maxLimit - items.size()));
                for (Offer offer : offers) {
                    if (items.size() >= maxLimit) break;
                    String subtitle = offer.getDescription() != null && !offer.getDescription().isBlank()
                            ? offer.getDescription()
                            : "Active Offer";
                    items.add(new SearchSuggestionItemDto(
                            "OFFER",
                            offer.getId() != null ? offer.getId().toString() : null,
                            offer.getTitle(),
                            subtitle,
                            null
                    ));
                }
            } catch (Exception ignored) {
            }
        }

        return new SearchSuggestionsResponse(q, items);
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000; // Earth radius in meters
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
