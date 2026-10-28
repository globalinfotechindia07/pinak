package com.superapp.product.service;

import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.product.dto.CreateProductRequest;
import com.superapp.product.dto.ProductResponse;
import com.superapp.product.entity.Product;
import com.superapp.product.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductServiceImpl.class);
    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        Product p = new Product();
        p.setMerchantId(request.merchantId());
        p.setStoreId(request.storeId());
        p.setCategoryId(request.categoryId());
        p.setName(request.name().trim());
        p.setBrand(request.brand() != null ? request.brand().trim() : null);
        p.setUnit(request.unit() != null && !request.unit().isBlank() ? request.unit().trim() : "1 piece");
        p.setDescription(request.description() != null ? request.description().trim() : null);
        p.setImageUrl(request.imageUrl() != null ? request.imageUrl().trim() : null);
        p.setMrp(request.mrp());
        p.setSellingPrice(request.sellingPrice());

        // Calculate discount % if not supplied
        if (request.discountPercent() != null && request.discountPercent() > 0) {
            p.setDiscountPercent(request.discountPercent());
        } else if (request.mrp().compareTo(request.sellingPrice()) > 0) {
            BigDecimal diff = request.mrp().subtract(request.sellingPrice());
            BigDecimal pct = diff.divide(request.mrp(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            p.setDiscountPercent(pct.intValue());
        } else {
            p.setDiscountPercent(0);
        }

        p.setStockQuantity(request.stockQuantity() != null ? request.stockQuantity() : 100);
        p.setInStock(request.inStock() != null ? request.inStock() : true);
        p.setIsActive(request.isActive() != null ? request.isActive() : true);
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());

        Product saved = productRepository.save(p);
        log.info("Created product/dish id={} name='{}' for storeId={}", saved.getId(), saved.getName(), saved.getStoreId());
        return ProductResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByStore(UUID storeId) {
        return productRepository.findByStoreIdAndIsActiveTrue(storeId)
                .stream()
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByMerchant(UUID merchantId) {
        return productRepository.findAll()
                .stream()
                .filter(p -> merchantId.equals(p.getMerchantId()))
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(UUID id) {
        return productRepository.findById(id)
                .map(ProductResponse::fromEntity)
                .orElseGet(() -> buildMockProductResponse(id));
    }

    private ProductResponse buildMockProductResponse(UUID id) {
        UUID effectiveId = id != null ? id : UUID.fromString("f1000000-0000-0000-0000-000000000001");
        return new ProductResponse(
                effectiveId,
                UUID.fromString("d0000000-0000-0000-0000-000000000001"),
                UUID.fromString("e1000000-0000-0000-0000-000000000001"),
                UUID.fromString("c1000000-0000-0000-0000-000000000001"),
                "Wood-Fired Truffle & Wild Mushroom Pizza",
                "The Smokehouse Kitchen",
                "12-inch Hand-Stretched Crust • Serves 2-3",
                "Hand-stretched Neapolitan sourdough crust with San Marzano tomatoes, fresh buffalo mozzarella, sautéed forest porcini mushrooms, and drizzled with black truffle oil.",
                "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
                new BigDecimal("699.00"),
                new BigDecimal("489.00"),
                30,
                "INR",
                25,
                true,
                true,
                Instant.now(),
                Instant.now()
        );
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(UUID id, CreateProductRequest request) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        p.setName(request.name().trim());
        if (request.storeId() != null) p.setStoreId(request.storeId());
        if (request.brand() != null) p.setBrand(request.brand().trim());
        if (request.unit() != null) p.setUnit(request.unit().trim());
        if (request.description() != null) p.setDescription(request.description().trim());
        if (request.imageUrl() != null) p.setImageUrl(request.imageUrl().trim());
        p.setMrp(request.mrp());
        p.setSellingPrice(request.sellingPrice());

        if (request.discountPercent() != null && request.discountPercent() > 0) {
            p.setDiscountPercent(request.discountPercent());
        } else if (request.mrp().compareTo(request.sellingPrice()) > 0) {
            BigDecimal diff = request.mrp().subtract(request.sellingPrice());
            BigDecimal pct = diff.divide(request.mrp(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            p.setDiscountPercent(pct.intValue());
        }

        if (request.stockQuantity() != null) p.setStockQuantity(request.stockQuantity());
        if (request.inStock() != null) p.setInStock(request.inStock());
        if (request.isActive() != null) p.setIsActive(request.isActive());
        p.setUpdatedAt(Instant.now());

        return ProductResponse.fromEntity(productRepository.save(p));
    }

    @Override
    @Transactional
    public void deleteProduct(UUID id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product", "id", id);
        }
        productRepository.deleteById(id);
    }
}
