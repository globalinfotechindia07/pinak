package com.superapp.mobile.controller;

import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.service.CategoryService;
import com.superapp.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Dedicated category API for the PINAK Mobile App.
 * Returns the active platform categories from the backend for mobile selection (Screen 08 - Category Preferences).
 */
@RestController
@RequestMapping({"/api/v1/mobile/categories", "/api/v1/mobile/profile/categories", "/api/v1/mobile/auth/categories"})
@Tag(name = "Mobile App - Categories", description = "PINAK Mobile Category Listing API")
public class MobileCategoryController {

    private final CategoryService categoryService;

    public MobileCategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "Get Mobile Categories", description = "Returns active platform categories from the backend for mobile onboarding (Screen 08) and category selection")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getMobileCategories() {
        List<CategoryResponse> categories = categoryService.getDiscoveryCategories(CategoryStatus.ACTIVE);
        return ResponseEntity.ok(ApiResponse.success("Categories retrieved successfully", categories));
    }
}
