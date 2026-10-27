package com.superapp.product.service;

import com.superapp.product.dto.CreateProductRequest;
import com.superapp.product.dto.ProductResponse;

import java.util.List;
import java.util.UUID;

public interface ProductService {
    ProductResponse createProduct(CreateProductRequest request);
    List<ProductResponse> getProductsByStore(UUID storeId);
    List<ProductResponse> getProductsByMerchant(UUID merchantId);
    ProductResponse getProductById(UUID id);
    ProductResponse updateProduct(UUID id, CreateProductRequest request);
    void deleteProduct(UUID id);
}
