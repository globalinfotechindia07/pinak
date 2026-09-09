package com.superapp.category.service;

import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.dto.CreateCategoryRequest;
import com.superapp.category.dto.UpdateCategoryRequest;
import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CategoryServiceImpl implements CategoryService {

    private static final Logger log = LoggerFactory.getLogger(CategoryServiceImpl.class);

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        String trimmedName = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Category", "name", trimmedName);
        }

        Category parent = null;
        if (request.parentId() != null) {
            parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category (parent)", "id", request.parentId()));
        }

        CategoryStatus status = request.status() != null ? request.status() : CategoryStatus.ACTIVE;
        Category category = new Category(trimmedName, parent, status);
        Category saved = categoryRepository.save(category);

        log.info("Created category id={} name='{}'", saved.getId(), saved.getName());
        return CategoryResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return CategoryResponse.fromEntity(category);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "'all'")
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse updateCategory(UUID id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        String trimmedName = request.name().trim();
        if (!category.getName().equalsIgnoreCase(trimmedName) && categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Category", "name", trimmedName);
        }

        Category parent = null;
        if (request.parentId() != null) {
            if (request.parentId().equals(id)) {
                throw new AppException("A category cannot be its own parent", ApiError.VALIDATION_FAILED, 400);
            }
            parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category (parent)", "id", request.parentId()));
        }

        category.setName(trimmedName);
        category.setParent(parent);
        if (request.status() != null) {
            category.setStatus(request.status());
        }

        Category updated = categoryRepository.save(category);
        log.info("Updated category id={} name='{}'", updated.getId(), updated.getName());
        return CategoryResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        // Unlink children if any
        List<Category> children = categoryRepository.findByParentId(id);
        for (Category child : children) {
            child.setParent(null);
            categoryRepository.save(child);
        }

        categoryRepository.delete(category);
        log.info("Deleted category id={} name='{}'", id, category.getName());
    }
}
