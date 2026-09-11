package com.superapp.category.mapper;

import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.dto.CreateCategoryRequest;
import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public Category toEntity(CreateCategoryRequest request, Category parent) {
        if (request == null) return null;
        CategoryStatus status = request.status() != null ? request.status() : CategoryStatus.ACTIVE;
        Integer displayOrder = request.displayOrder() != null ? request.displayOrder() : 0;
        return new Category(
                request.name().trim(),
                request.slug(),
                request.description() != null ? request.description().trim() : null,
                request.icon() != null ? request.icon().trim() : null,
                displayOrder,
                parent,
                status
        );
    }

    public CategoryResponse toResponse(Category category) {
        return CategoryResponse.fromEntity(category);
    }

    public CategoryResponse toDiscoveryResponse(Category category) {
        return CategoryResponse.forDiscovery(category);
    }

    public CategoryResponse toSingleDiscoveryResponse(Category category) {
        return CategoryResponse.forSingleDiscovery(category);
    }
}
