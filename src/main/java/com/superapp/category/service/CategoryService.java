package com.superapp.category.service;

import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.dto.CreateCategoryRequest;
import com.superapp.category.dto.UpdateCategoryRequest;

import java.util.List;
import java.util.UUID;

public interface CategoryService {

    CategoryResponse createCategory(CreateCategoryRequest request);

    CategoryResponse getCategoryById(UUID id);

    List<CategoryResponse> getAllCategories();

    CategoryResponse updateCategory(UUID id, UpdateCategoryRequest request);

    void deleteCategory(UUID id);
}
