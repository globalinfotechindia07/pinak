package com.superapp.product.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.product.dto.CreateProductRequest;
import com.superapp.product.dto.ProductResponse;
import com.superapp.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Store Products & Food Dishes", description = "Management of physical store products, retail inventory items, and restaurant food dishes")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    @Operation(summary = "Add a new product or food dish for a store", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody CreateProductRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product / food dish added successfully", response));
    }

    @GetMapping("/store/{storeId}")
    @Operation(summary = "Get all active products or food dishes for a specific store branch")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProductsByStore(@PathVariable UUID storeId) {
        List<ProductResponse> products = productService.getProductsByStore(storeId);
        return ResponseEntity.ok(ApiResponse.success("Store products retrieved successfully", products));
    }

    @GetMapping("/merchant/{merchantId}")
    @Operation(summary = "Get all products across all stores of a merchant", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProductsByMerchant(@PathVariable UUID merchantId) {
        List<ProductResponse> products = productService.getProductsByMerchant(merchantId);
        return ResponseEntity.ok(ApiResponse.success("Merchant products retrieved successfully", products));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single product or food dish by ID")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable UUID id) {
        ProductResponse response = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success("Product retrieved", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a product or food dish", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody CreateProductRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product / food dish updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a product or food dish", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product / food dish deleted successfully", null));
    }
}
