package com.superapp.mobile.service;

import com.superapp.category.repository.CategoryRepository;
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

    public static final UUID CANONICAL_MOCK_PRODUCT_ID = UUID.fromString("f1000000-0000-0000-0000-000000000001");
    private static final UUID SMOKEHOUSE_STORE_ID = UUID.fromString("e1000000-0000-0000-0000-000000000001");

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

        log.info("Providing canonical fallback dummy response for Product Detail (ID: {})", productId);
        return buildCanonicalFallback(productId, lat, lng);
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

        String discountText = discountPct > 0 ? "Flat " + discountPct + "% OFF • Save ₹" + savings : "Best Price Guaranteed";

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
                "₹",
                Boolean.TRUE.equals(p.getInStock()),
                p.getStockQuantity() != null ? p.getStockQuantity() : 50,
                "In Stock • Delivered in 25-35 mins",
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
                        "Free delivery on orders above ₹499",
                        true,
                        "Ready for takeaway in 15 mins"
                ),
                buildDefaultReviews(),
                buildFrequentlyBought(),
                buildSimilarProducts(),
                new BottomBuyBarDto(
                        sellingPrice,
                        mrp,
                        "Save ₹" + savings,
                        1,
                        10,
                        true,
                        "Customization & add-ons available",
                        new ActionBtnDto("ADD_TO_CART", "Add to Cart • ₹" + sellingPrice, true),
                        new ActionBtnDto("BUY_NOW", "Buy Now", true)
                )
        );
    }

    private MobileProductDetailDto buildCanonicalFallback(UUID requestedId, Double lat, Double lng) {
        String idStr = (requestedId != null) ? requestedId.toString() : "f1000000-0000-0000-0000-000000000001";
        BigDecimal mrp = new BigDecimal("699.00");
        BigDecimal sellingPrice = new BigDecimal("489.00");
        BigDecimal savings = mrp.subtract(sellingPrice);
        int discountPct = 30;

        List<String> gallery = List.of(
                "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"
        );

        ProductStoreInfoDto storeInfo = new ProductStoreInfoDto(
                SMOKEHOUSE_STORE_ID.toString(),
                "The Smokehouse Grill",
                true,
                4.8,
                "1.2 km away • Indiranagar",
                "123, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
                "+919880011234",
                true
        );

        ProductCoinPerkDto coinBanner = new ProductCoinPerkDto(
                "2X",
                "Earn 5.00% PINAK Cashback Coins",
                "2X BOOST",
                "Earn 24 PINAK Gold Coins on this purchase"
        );

        return new MobileProductDetailDto(
                idStr,
                "Wood-Fired Truffle & Wild Mushroom Pizza",
                "The Smokehouse Kitchen",
                "12-inch Hand-Stretched Crust • Serves 2-3",
                "Hand-stretched Neapolitan sourdough crust with San Marzano tomatoes, fresh buffalo mozzarella, sautéed forest porcini mushrooms, and drizzled with black truffle oil.",
                "Crafted using 48-hour fermented Italian 00 flour dough, baked at 450°C in our traditional oak wood-fired oven. Topped with imported Italian fior di latte, aged Parmigiano Reggiano, hand-picked wild porcini and shiitake mushrooms, finished with aromatic Umbrian black summer truffle oil and fresh basil.",
                gallery.get(0),
                gallery,
                gallery.size(),
                mrp,
                sellingPrice,
                discountPct,
                savings,
                "Flat 30% OFF • Save ₹210",
                "INR",
                "₹",
                true,
                25,
                "In Stock • Delivered in 25-35 mins",
                true,
                "VEG",
                new CategorySummaryDto(
                        "c1000000-0000-0000-0000-000000000001",
                        "Gourmet Wood-Fired Pizzas",
                        "gourmet-wood-fired-pizzas"
                ),
                List.of("PINAK EXCLUSIVE", "BESTSELLER", "WOOD-FIRED", "ORGANIC INGREDIENTS"),
                4.8,
                "856+ reviews",
                coinBanner,
                coinBanner,
                storeInfo,
                List.of(
                        "Baked in 450°C Italian Oak Wood-Fired Oven",
                        "48-Hour Cold-Fermented Sourdough Base",
                        "Imported Italian Buffalo Mozzarella & Umbrian Truffle Oil",
                        "100% Vegetarian & No Artificial Preservatives"
                ),
                Map.of(
                        "Serving Size", "1 Slice (approx 125g)",
                        "Calories", "285 kcal",
                        "Protein", "12g",
                        "Carbohydrates", "34g",
                        "Fat", "11g"
                ),
                new DeliveryOptionsDto(
                        true,
                        "Delivered in 25-35 mins",
                        "Free delivery on orders above ₹499",
                        true,
                        "Ready for takeaway in 15 mins"
                ),
                buildDefaultReviews(),
                buildFrequentlyBought(),
                buildSimilarProducts(),
                new BottomBuyBarDto(
                        sellingPrice,
                        mrp,
                        "Save ₹" + savings,
                        1,
                        10,
                        true,
                        "Customizable options available",
                        new ActionBtnDto("ADD_TO_CART", "Add to Cart • ₹" + sellingPrice, true),
                        new ActionBtnDto("BUY_NOW", "Buy Now", true)
                )
        );
    }

    private ProductStoreInfoDto resolveStoreInfo(UUID storeId, Double lat, Double lng) {
        if (storeId != null) {
            var storeOpt = storeRepository.findById(storeId);
            if (storeOpt.isPresent()) {
                Store s = storeOpt.get();
                return new ProductStoreInfoDto(
                        s.getId().toString(),
                        s.getName() != null ? s.getName() : "Partner Store",
                        true,
                        4.8,
                        "Indiranagar • 1.5 km",
                        s.getAddress() != null ? s.getAddress() : "Bengaluru",
                        s.getPhone() != null ? s.getPhone() : "+919876543210",
                        true
                );
            }
        }
        return new ProductStoreInfoDto(
                SMOKEHOUSE_STORE_ID.toString(),
                "The Smokehouse Grill",
                true,
                4.8,
                "1.2 km away • Indiranagar",
                "123, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
                "+919880011234",
                true
        );
    }

    private ReviewsSummaryDto buildDefaultReviews() {
        return new ReviewsSummaryDto(
                4.8,
                856,
                Map.of("5_star", 720, "4_star", 102, "3_star", 24, "2_star", 6, "1_star", 4),
                List.of(
                        new FeaturedReviewDto(
                                "Ananya Roy",
                                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
                                5,
                                "2 days ago",
                                "Hands down the most authentic truffle pizza in Bengaluru! Crust was airy and charred to perfection.",
                                true
                        ),
                        new FeaturedReviewDto(
                                "Vikram Sethi",
                                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
                                5,
                                "1 week ago",
                                "The aroma of truffle oil when you open the box is incredible. Worth every penny with the 30% discount!",
                                true
                        )
                )
        );
    }

    private List<SimpleProductCardDto> buildFrequentlyBought() {
        return List.of(
                new SimpleProductCardDto(
                        "f1000000-0000-0000-0000-000000000002",
                        "Artisanal Rosemary & Garlic Herb Focaccia",
                        new BigDecimal("189.00"),
                        new BigDecimal("249.00"),
                        4.7,
                        "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80"
                ),
                new SimpleProductCardDto(
                        "f1000000-0000-0000-0000-000000000003",
                        "Single-Origin Nitro Cold Brew (330ml)",
                        new BigDecimal("169.00"),
                        new BigDecimal("219.00"),
                        4.8,
                        "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80"
                )
        );
    }

    private List<SimpleProductCardDto> buildSimilarProducts() {
        return List.of(
                new SimpleProductCardDto(
                        "f1000000-0000-0000-0000-000000000004",
                        "Four Cheese Quattro Formaggi Pizza",
                        new BigDecimal("529.00"),
                        new BigDecimal("699.00"),
                        4.7,
                        "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80"
                ),
                new SimpleProductCardDto(
                        "f1000000-0000-0000-0000-000000000005",
                        "Classic Neapolitan Margherita",
                        new BigDecimal("399.00"),
                        new BigDecimal("499.00"),
                        4.9,
                        "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=400&q=80"
                )
        );
    }
}
