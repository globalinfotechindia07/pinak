package com.superapp.category.controller;

import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.dto.CreateCategoryRequest;
import com.superapp.category.dto.UpdateCategoryRequest;
import com.superapp.category.service.CategoryService;
import com.superapp.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/categories")
@Tag(name = "Admin Categories", description = "Admin master data management for categories")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminCategoryController {

    private final CategoryService categoryService;

    public AdminCategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "Get all categories (Admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> list = categoryService.getAllCategoriesAdmin();
        return ResponseEntity.ok(ApiResponse.success("Categories fetched successfully", list));
    }

    @PostMapping
    @Operation(summary = "Create a category (Admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request,
            Authentication authentication) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        CategoryResponse response = categoryService.createCategoryAdmin(request, adminUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category created successfully", response));
    }

    @GetMapping("/{categoryId}")
    @Operation(summary = "Get category by ID (Admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(
            @PathVariable UUID categoryId) {
        CategoryResponse response = categoryService.getCategoryByIdAdmin(categoryId);
        return ResponseEntity.ok(ApiResponse.success("Category fetched successfully", response));
    }

    @PutMapping("/{categoryId}")
    @Operation(summary = "Update category by ID (Admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable UUID categoryId,
            @Valid @RequestBody UpdateCategoryRequest request,
            Authentication authentication) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        CategoryResponse response = categoryService.updateCategoryAdmin(categoryId, request, adminUser);
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", response));
    }

    @DeleteMapping("/{categoryId}")
    @Operation(summary = "Deactivate category logically (Admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deactivateCategory(
            @PathVariable UUID categoryId,
            Authentication authentication) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        categoryService.deactivateCategoryAdmin(categoryId, adminUser);
        return ResponseEntity.noContent().build();
    }
}
