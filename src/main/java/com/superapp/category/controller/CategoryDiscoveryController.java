package com.superapp.category.controller;

import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.service.CategoryService;
import com.superapp.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/discovery/categories")
@Tag(name = "Customer Discovery — Categories", description = "Public category discovery endpoints for shoppers and mobile discovery")
public class CategoryDiscoveryController {

    private final CategoryService categoryService;

    public CategoryDiscoveryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "List categories for discovery (Public, returns ACTIVE categories by default)")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getDiscoveryCategories(
            @RequestParam(required = false) CategoryStatus status) {
        List<CategoryResponse> categories = categoryService.getDiscoveryCategories(status);
        return ResponseEntity.ok(ApiResponse.success("Categories fetched successfully", categories));
    }

    @GetMapping("/{categoryId}")
    @Operation(summary = "Get single category for discovery (Public, active only)")
    public ResponseEntity<ApiResponse<CategoryResponse>> getDiscoveryCategoryById(
            @PathVariable UUID categoryId) {
        CategoryResponse response = categoryService.getDiscoveryCategoryById(categoryId);
        return ResponseEntity.ok(ApiResponse.success("Category fetched successfully", response));
    }
}
