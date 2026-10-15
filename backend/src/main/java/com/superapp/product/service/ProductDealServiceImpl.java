package com.superapp.product.service;

import com.superapp.category.entity.Category;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.offer.dto.DiscoverPaginationDto;
import com.superapp.product.dto.NearbyProductDealItemDto;
import com.superapp.product.dto.NearbyProductDealsResponse;
import com.superapp.product.entity.Product;
import com.superapp.product.repository.ProductRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ProductDealServiceImpl implements ProductDealService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;

    public ProductDealServiceImpl(
            ProductRepository productRepository,
            StoreRepository storeRepository,
            CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.storeRepository = storeRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public NearbyProductDealsResponse getNearbyProductDeals(
            Double latitude, Double longitude, Double radiusKm,
            UUID categoryId, UUID merchantId, String sort, Integer limit, String cursor) {

        int limitVal = (limit != null && limit > 0 && limit <= 50) ? limit : 10;
        List<Product> products = new ArrayList<>();
        boolean hasMore = false;

        if (categoryId != null) {
            Page<Product> page = productRepository.findTopDealsByCategoryId(categoryId, PageRequest.of(0, limitVal));
            products = page.getContent();
            hasMore = page.hasNext();
        } else if (latitude != null && longitude != null) {
            double radiusMeters = (radiusKm != null && radiusKm > 0 ? radiusKm : 5.0) * 1000.0;
            Page<Store> nearbyStores = storeRepository.findNearbyApprovedStores(
                    latitude, longitude, radiusMeters, PageRequest.of(0, 50));
            List<UUID> storeIds = nearbyStores.getContent().stream().map(Store::getId).toList();
            if (!storeIds.isEmpty()) {
                Page<Product> page = productRepository.findTopDealsByStoreIds(storeIds, PageRequest.of(0, limitVal));
                products = page.getContent();
                hasMore = page.hasNext();
            }
        }

        if (products.isEmpty()) {
            Page<Product> page = productRepository.findTopDeals(PageRequest.of(0, limitVal));
            products = page.getContent();
            hasMore = page.hasNext();
        }

        List<NearbyProductDealItemDto> dtos = new ArrayList<>();
        for (Product p : products) {
            Store store = p.getStoreId() != null ? storeRepository.findById(p.getStoreId()).orElse(null) : null;
            Category category = p.getCategoryId() != null ? categoryRepository.findById(p.getCategoryId()).orElse(null) : null;

            Integer distanceMeters = null;
            if (latitude != null && longitude != null && store != null && store.getLatitude() != null && store.getLongitude() != null) {
                double dist = calculateHaversineDistance(
                        latitude, longitude,
                        store.getLatitude().doubleValue(), store.getLongitude().doubleValue()
                );
                distanceMeters = (int) Math.round(dist);
            }

            String catIdStr = category != null ? category.getId().toString() : (p.getCategoryId() != null ? p.getCategoryId().toString() : null);
            String catName = category != null ? category.getName() : "General";
            NearbyProductDealItemDto.ProductCategorySummaryDto catSummary = new NearbyProductDealItemDto.ProductCategorySummaryDto(
                    catIdStr, catName
            );

            NearbyProductDealItemDto.ProductPriceSummaryDto priceSummary = new NearbyProductDealItemDto.ProductPriceSummaryDto(
                    p.getCurrency() != null ? p.getCurrency() : "INR",
                    p.getSellingPrice(),
                    p.getMrp(),
                    p.getDiscountPercent() != null ? p.getDiscountPercent() : 0
            );

            String pIdStr = p.getId() != null ? p.getId().toString() : "prd_1001";
            NearbyProductDealItemDto.ProductOfferBadgeDto offerBadge = new NearbyProductDealItemDto.ProductOfferBadgeDto(
                    "off_deal_" + pIdStr.substring(0, Math.min(8, pIdStr.length())),
                    (p.getDiscountPercent() != null ? p.getDiscountPercent() : 20) + "% OFF",
                    "PERCENTAGE_DISCOUNT"
            );

            NearbyProductDealItemDto.ProductBranchSummaryDto branchSummary = new NearbyProductDealItemDto.ProductBranchSummaryDto(
                    p.getStoreId() != null ? p.getStoreId().toString() : null,
                    store != null ? store.getStoreName() : "Nearby Partner Store",
                    distanceMeters
            );

            NearbyProductDealItemDto.ProductAvailabilityDto availability = new NearbyProductDealItemDto.ProductAvailabilityDto(
                    Boolean.TRUE.equals(p.getInStock()),
                    Boolean.TRUE.equals(p.getInStock()) ? "IN_STOCK" : "OUT_OF_STOCK"
            );

            dtos.add(new NearbyProductDealItemDto(
                    pIdStr,
                    p.getName(),
                    p.getBrand(),
                    p.getImageUrl(),
                    catSummary,
                    p.getUnit() != null ? p.getUnit() : "1 unit",
                    priceSummary,
                    offerBadge,
                    branchSummary,
                    availability,
                    false,
                    "Add to Cart"
            ));
        }

        return new NearbyProductDealsResponse(dtos, DiscoverPaginationDto.of(limitVal, hasMore));
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
