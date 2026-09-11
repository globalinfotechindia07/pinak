package com.superapp.category.service;

import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.dto.CreateCategoryRequest;
import com.superapp.category.dto.UpdateCategoryRequest;
import com.superapp.category.entity.CategoryStatus;

import java.util.List;
import java.util.UUID;

public interface CategoryService {

    // ---- Discovery APIs (Public / Customers) ----
    List<CategoryResponse> getDiscoveryCategories(CategoryStatus status);

    CategoryResponse getDiscoveryCategoryById(UUID id);

    // ---- Admin APIs ----
    CategoryResponse createCategoryAdmin(CreateCategoryRequest request, String adminUserId);

    CategoryResponse updateCategoryAdmin(UUID id, UpdateCategoryRequest request, String adminUserId);

    void deactivateCategoryAdmin(UUID id, String adminUserId);

    CategoryResponse getCategoryByIdAdmin(UUID id);

    List<CategoryResponse> getAllCategoriesAdmin();

    // ---- Backward Compatibility APIs ----
    CategoryResponse createCategory(CreateCategoryRequest request);

    CategoryResponse getCategoryById(UUID id);

    List<CategoryResponse> getAllCategories();

    CategoryResponse updateCategory(UUID id, UpdateCategoryRequest request);

    void deleteCategory(UUID id);
}
