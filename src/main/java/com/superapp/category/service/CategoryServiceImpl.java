package com.superapp.category.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.dto.CreateCategoryRequest;
import com.superapp.category.dto.UpdateCategoryRequest;
import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.mapper.CategoryMapper;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CategoryServiceImpl implements CategoryService {

    private static final Logger log = LoggerFactory.getLogger(CategoryServiceImpl.class);

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public CategoryServiceImpl(CategoryRepository categoryRepository,
                               CategoryMapper categoryMapper,
                               AuditService auditService,
                               ObjectMapper objectMapper) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    // Convenience constructor for tests
    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this(categoryRepository, new CategoryMapper(), null, new ObjectMapper());
    }

    // =========================================================================
    // Discovery (Public Customer)
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "master_categories_active", key = "#status != null ? #status.name() : 'ACTIVE'")
    public List<CategoryResponse> getDiscoveryCategories(CategoryStatus status) {
        CategoryStatus effectiveStatus = status != null ? status : CategoryStatus.ACTIVE;
        return categoryRepository.findByStatusOrderByDisplayOrderAsc(effectiveStatus)
                .stream()
                .map(categoryMapper::toDiscoveryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getDiscoveryCategoryById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found", ApiError.CATEGORY_NOT_FOUND));

        if (!category.isActive()) {
            throw new ResourceNotFoundException("Category not found", ApiError.CATEGORY_NOT_FOUND);
        }

        return categoryMapper.toSingleDiscoveryResponse(category);
    }

    // =========================================================================
    // Admin Operations
    // =========================================================================

    @Override
    @Transactional
    @CacheEvict(value = {"master_categories_active", "categories"}, allEntries = true)
    public CategoryResponse createCategoryAdmin(CreateCategoryRequest request, String adminUserId) {
        String trimmedName = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Category already exists", ApiError.CATEGORY_ALREADY_EXISTS);
        }

        String slug = generateOrValidateSlug(request.slug(), trimmedName);
        if (categoryRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Category slug already exists", ApiError.CATEGORY_ALREADY_EXISTS);
        }

        Category parent = null;
        if (request.parentId() != null) {
            parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found", ApiError.CATEGORY_NOT_FOUND));
            if (!parent.isActive()) {
                throw new AppException("Parent category is inactive", ApiError.CATEGORY_INACTIVE, 409);
            }
        }

        Category category = categoryMapper.toEntity(request, parent);
        category.setName(trimmedName);
        category.setSlug(slug);
        category.setCreatedBy(adminUserId);
        category.setUpdatedBy(adminUserId);

        Category saved = categoryRepository.save(category);
        log.info("Created category id={} slug='{}' by admin='{}'", saved.getId(), saved.getSlug(), adminUserId);

        recordAudit(AuditEventType.CATEGORY_CREATED, adminUserId, saved.getId().toString(), null, toAuditMap(saved));

        return categoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"master_categories_active", "categories"}, allEntries = true)
    public CategoryResponse updateCategoryAdmin(UUID id, UpdateCategoryRequest request, String adminUserId) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found", ApiError.CATEGORY_NOT_FOUND));

        Map<String, Object> oldAuditState = toAuditMap(category);

        String trimmedName = request.name().trim();
        if (!category.getName().equalsIgnoreCase(trimmedName) && categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Category already exists", ApiError.CATEGORY_ALREADY_EXISTS);
        }

        String slug = generateOrValidateSlug(request.slug(), trimmedName);
        if (!slug.equalsIgnoreCase(category.getSlug()) && categoryRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Category slug already exists", ApiError.CATEGORY_ALREADY_EXISTS);
        }

        Category parent = null;
        if (request.parentId() != null) {
            if (request.parentId().equals(id)) {
                throw new AppException("A category cannot be its own parent", ApiError.VALIDATION_FAILED, 400);
            }
            parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found", ApiError.CATEGORY_NOT_FOUND));
        }

        // Apply permitted fields (Mass assignment protection: do NOT change status or id)
        category.setName(trimmedName);
        category.setSlug(slug);
        if (request.description() != null) {
            category.setDescription(request.description().trim());
        }
        if (request.icon() != null) {
            category.setIcon(request.icon().trim());
        }
        if (request.displayOrder() != null) {
            category.setDisplayOrder(request.displayOrder());
        }
        category.setParent(parent);
        category.setUpdatedBy(adminUserId);

        Category updated = categoryRepository.save(category);
        log.info("Updated category id={} slug='{}' by admin='{}'", updated.getId(), updated.getSlug(), adminUserId);

        recordAudit(AuditEventType.CATEGORY_UPDATED, adminUserId, updated.getId().toString(), oldAuditState, toAuditMap(updated));

        return categoryMapper.toResponse(updated);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"master_categories_active", "categories"}, allEntries = true)
    public void deactivateCategoryAdmin(UUID id, String adminUserId) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found", ApiError.CATEGORY_NOT_FOUND));

        Map<String, Object> oldAuditState = toAuditMap(category);

        // Soft deactivation
        category.setStatus(CategoryStatus.INACTIVE);
        category.setUpdatedBy(adminUserId);
        Category saved = categoryRepository.save(category);

        log.info("Deactivated category id={} slug='{}' by admin='{}'", saved.getId(), saved.getSlug(), adminUserId);

        recordAudit(AuditEventType.CATEGORY_DEACTIVATED, adminUserId, saved.getId().toString(), oldAuditState, toAuditMap(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryByIdAdmin(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found", ApiError.CATEGORY_NOT_FOUND));
        return categoryMapper.toResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategoriesAdmin() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    // =========================================================================
    // Backward Compatibility
    // =========================================================================

    @Override
    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        return createCategoryAdmin(request, "SYSTEM");
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(UUID id) {
        return getCategoryByIdAdmin(id);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "'all'")
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(UUID id, UpdateCategoryRequest request) {
        return updateCategoryAdmin(id, request, "SYSTEM");
    }

    @Override
    @Transactional
    public void deleteCategory(UUID id) {
        deactivateCategoryAdmin(id, "SYSTEM");
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private String generateOrValidateSlug(String providedSlug, String name) {
        if (providedSlug != null && !providedSlug.isBlank()) {
            return providedSlug.trim().toLowerCase()
                    .replaceAll("[^a-z0-9]+", "-")
                    .replaceAll("^-|-$", "");
        }
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private Map<String, Object> toAuditMap(Category category) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", category.getId().toString());
        map.put("name", category.getName());
        map.put("slug", category.getSlug());
        map.put("status", category.getStatus() != null ? category.getStatus().name() : null);
        map.put("displayOrder", category.getDisplayOrder());
        return map;
    }

    private void recordAudit(AuditEventType eventType, String adminUserId, String entityId,
                             Map<String, Object> oldValue, Map<String, Object> newValue) {
        if (auditService == null) return;
        try {
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("adminUserId", adminUserId);
            metadata.put("entityId", entityId);
            metadata.put("action", eventType.name());
            metadata.put("oldValue", oldValue);
            metadata.put("newValue", newValue);
            metadata.put("timestamp", Instant.now().toString());
            metadata.put("requestId", MDC.get("requestId"));

            UUID userUuid = null;
            if (adminUserId != null) {
                try {
                    userUuid = UUID.fromString(adminUserId);
                } catch (IllegalArgumentException ignored) {
                }
            }

            auditService.record(
                    eventType,
                    userUuid,
                    null,
                    null,
                    MDC.get("requestId"),
                    objectMapper.writeValueAsString(metadata)
            );
        } catch (Exception ex) {
            log.error("Failed to serialize audit metadata for category event: {}", ex.getMessage());
        }
    }
}
