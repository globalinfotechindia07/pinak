package com.superapp.mobile.service;

import com.superapp.category.repository.CategoryRepository;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.mobile.dto.MobileProductDetailDto;
import com.superapp.mobile.dto.MobileProductDetailDto.*;
import com.superapp.product.entity.Product;
import com.superapp.product.repository.ProductRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class MobileProductDetailServiceImpl implements MobileProductDetailService {

    private static final Logger log = LoggerFactory.getLogger(MobileProductDetailServiceImpl.class);

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;

    public MobileProductDetailServiceImpl(
            ProductRepository productRepository,
            StoreRepository storeRepository,
            CategoryRepository categoryRepository
    ) {
        this.productRepository = productRepository;
        this.storeRepository = storeRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public MobileProductDetailDto getProductDetail(UUID productId, Double lat, Double lng) {
        if (productId != null) {
            Optional<Product> productOpt = productRepository.findById(productId);
            if (productOpt.isPresent()) {
                return buildFromEntity(productOpt.get(), lat, lng);
            }
        }

        throw new ResourceNotFoundException("Product not found with id: " + productId);
    }

    private MobileProductDetailDto buildFromEntity(Product p, Double lat, Double lng) {
        String prodId = p.getId().toString();
        String name = p.getName();
        String brand = p.getBrand() != null ? p.getBrand() : "Artisan Reserve";
        String unit = p.getUnit() != null ? p.getUnit() : "1 piece";
        String shortDesc = p.getDescription() != null ? p.getDescription() : "Freshly crafted premium quality item.";
        String longDesc = shortDesc + " Sourced from certified partner merchants and verified for peak freshness and quality assurance.";

        String primaryImg = (p.getImageUrl() != null && !p.getImageUrl().isBlank())
                ? p.getImageUrl()
                : "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80";

        List<String> gallery = List.of(
                primaryImg,
                "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80"
        );

        BigDecimal mrp = p.getMrp() != null ? p.getMrp() : BigDecimal.valueOf(499.00);
        BigDecimal sellingPrice = p.getSellingPrice() != null ? p.getSellingPrice() : mrp;
        BigDecimal savings = mrp.subtract(sellingPrice).max(BigDecimal.ZERO);
        int discountPct = p.getDiscountPercent() != null ? p.getDiscountPercent() : 0;
        if (discountPct == 0 && mrp.compareTo(BigDecimal.ZERO) > 0 && savings.compareTo(BigDecimal.ZERO) > 0) {
            discountPct = savings.divide(mrp, 2, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).intValue();
        }

        String discountText = discountPct > 0 ? "Flat " + discountPct + "% OFF â€¢ Save â‚¹" + savings : "Best Price Guaranteed";

        // Store info
        ProductStoreInfoDto storeInfo = resolveStoreInfo(p.getStoreId(), lat, lng);

        // Coins banner
        ProductCoinPerkDto coinBanner = new ProductCoinPerkDto(
                "2X",
                "Earn 5.00% PINAK Cashback Coins",
                "2X BOOST",
                "Earn " + Math.max(10, sellingPrice.multiply(BigDecimal.valueOf(0.05)).intValue()) + " PINAK Gold Coins on this purchase"
        );

        return new MobileProductDetailDto(
                prodId,
                name,
                brand,
                unit,
                shortDesc,
                longDesc,
                primaryImg,
                gallery,
                gallery.size(),
                mrp,
                sellingPrice,
                discountPct,
                savings,
                discountText,
                "INR",
                "â‚¹",
                Boolean.TRUE.equals(p.getInStock()),
                p.getStockQuantity() != null ? p.getStockQuantity() : 50,
                "In Stock â€¢ Delivered in 25-35 mins",
                true,
                "VEG",
                new CategorySummaryDto(
                        p.getCategoryId() != null ? p.getCategoryId().toString() : UUID.randomUUID().toString(),
                        "Gourmet Delights",
                        "gourmet-delights"
                ),
                List.of("PINAK EXCLUSIVE", "BESTSELLER", "VERIFIED STORE"),
                4.8,
                "850+ ratings",
                coinBanner,
                coinBanner,
                storeInfo,
                List.of(
                        "Freshly prepared on order",
                        "No artificial colors or preservatives",
                        "100% Quality Guaranteed by PINAK"
                ),
                Map.of(
                        "Serving Size", unit,
                        "Calories", "320 kcal",
                        "Protein", "11g",
                        "Carbohydrates", "38g"
                ),
                new DeliveryOptionsDto(
                        true,
                        "Delivered in 25-35 mins",
                        "Free delivery on orders above â‚¹499",
                        true,
                        "Ready for takeaway in 15 mins"
                ),
                buildDefaultReviews(),
                buildFrequentlyBought(),
                buildSimilarProducts(),
                new BottomBuyBarDto(
                        sellingPrice,
                        mrp,
                        "Save â‚¹" + savings,
                        1,
                        10,
                        true,
                        "Customization & add-ons available",
                        new ActionBtnDto("ADD_TO_CART", "Add to Cart â€¢ â‚¹" + sellingPrice, true),
                        new ActionBtnDto("BUY_NOW", "Buy Now", true)
                )
        );
    }

    private List<SimpleProductCardDto> buildFrequentlyBought() {
        return Collections.emptyList();
    }

    private List<SimpleProductCardDto> buildSimilarProducts() {
        return Collections.emptyList();
    }

    private ProductStoreInfoDto resolveStoreInfo(UUID storeId, Double userLat, Double userLng) {
        if (storeId == null) {
            return new ProductStoreInfoDto(
                    UUID.randomUUID().toString(),
                    "PINAK Verified Store",
                    true,
                    4.8,
                    "2.1 km • Downtown",
                    "Main Street, Nagpur",
                    "+91 9876543210",
                    true
            );
        }

        Optional<Store> storeOpt = storeRepository.findById(storeId);
        if (storeOpt.isEmpty()) {
            return new ProductStoreInfoDto(
                    storeId.toString(),
                    "PINAK Partner Store",
                    true,
                    4.7,
                    "In your area",
                    "Nagpur Central",
                    "+91 9876543210",
                    true
            );
        }

        Store s = storeOpt.get();
        String distanceText = "In your area";
        if (userLat != null && userLng != null && s.getLatitude() != null && s.getLongitude() != null) {
            double meters = calculateDistanceMeters(userLat, userLng, s.getLatitude().doubleValue(), s.getLongitude().doubleValue());
            double km = Math.round((meters / 1000.0) * 10.0) / 10.0;
            distanceText = km + " km";
        }

        return new ProductStoreInfoDto(
                s.getId().toString(),
                s.getStoreName() != null ? s.getStoreName() : "Partner Store",
                true,
                s.getRating() != null ? s.getRating().doubleValue() : 4.8,
                distanceText,
                s.getAddress() != null ? s.getAddress() : "",
                s.getPhone() != null ? s.getPhone() : "",
                true
        );
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

    private ReviewsSummaryDto buildDefaultReviews() {
        return new ReviewsSummaryDto(
                4.8,
                348,
                Map.of("5", 260, "4", 65, "3", 15, "2", 5, "1", 3),
                List.of(
                        new FeaturedReviewDto(
                                "Ananya Sharma",
                                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
                                5,
                                "2 days ago",
                                "Exceptional quality and pristine packaging. Highly recommended!",
                                true
                        ),
                        new FeaturedReviewDto(
                                "Rohan Mehta",
                                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
                                5,
                                "1 week ago",
                                "Great value with PINAK cashback and coins discount applied seamlessly.",
                                true
                        )
                )
        );
    }

}
