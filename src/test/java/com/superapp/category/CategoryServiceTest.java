package com.superapp.category;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.dto.CreateCategoryRequest;
import com.superapp.category.dto.UpdateCategoryRequest;
import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.mapper.CategoryMapper;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.category.service.CategoryServiceImpl;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Spy
    private CategoryMapper categoryMapper = new CategoryMapper();

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private UUID parentId;
    private Category parentCategory;

    @BeforeEach
    void setUp() {
        parentId = UUID.randomUUID();
        parentCategory = new Category("Dining", null, CategoryStatus.ACTIVE);
        parentCategory.setId(parentId);
        parentCategory.setSlug("dining");
    }

    @Test
    @DisplayName("Create top-level category succeeds")
    void createCategory_topLevel_success() {
        CreateCategoryRequest request = new CreateCategoryRequest("Dining", null, CategoryStatus.ACTIVE);

        when(categoryRepository.existsByNameIgnoreCase("Dining")).thenReturn(false);
        when(categoryRepository.existsBySlug("dining")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category c = invocation.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CategoryResponse response = categoryService.createCategory(request);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Dining");
        assertThat(response.slug()).isEqualTo("dining");
        assertThat(response.parentId()).isNull();
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("Create child category with valid parent succeeds")
    void createCategory_child_success() {
        UUID childId = UUID.randomUUID();
        CreateCategoryRequest request = new CreateCategoryRequest("Cafes", parentId, CategoryStatus.ACTIVE);

        when(categoryRepository.existsByNameIgnoreCase("Cafes")).thenReturn(false);
        when(categoryRepository.existsBySlug("cafes")).thenReturn(false);
        when(categoryRepository.findById(parentId)).thenReturn(Optional.of(parentCategory));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category c = invocation.getArgument(0);
            c.setId(childId);
            return c;
        });

        CategoryResponse response = categoryService.createCategory(request);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Cafes");
        assertThat(response.parentId()).isEqualTo(parentId);
        assertThat(response.parentName()).isEqualTo("Dining");
    }

    @Test
    @DisplayName("Create duplicate category name throws DuplicateResourceException")
    void createCategory_duplicateName_throwsException() {
        CreateCategoryRequest request = new CreateCategoryRequest("Dining", null, CategoryStatus.ACTIVE);
        when(categoryRepository.existsByNameIgnoreCase("Dining")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    @DisplayName("Create duplicate category slug throws DuplicateResourceException")
    void createCategory_duplicateSlug_throwsException() {
        CreateCategoryRequest request = new CreateCategoryRequest("Dining", "dining-slug", null, null, 1);
        when(categoryRepository.existsByNameIgnoreCase("Dining")).thenReturn(false);
        when(categoryRepository.existsBySlug("dining-slug")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategoryAdmin(request, "admin_1"))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    @DisplayName("Create category with inactive parent throws 409 Conflict")
    void createCategory_inactiveParent_throwsException() {
        parentCategory.setStatus(CategoryStatus.INACTIVE);
        CreateCategoryRequest request = new CreateCategoryRequest("Fine Dining", parentId, CategoryStatus.ACTIVE);

        when(categoryRepository.existsByNameIgnoreCase("Fine Dining")).thenReturn(false);
        when(categoryRepository.existsBySlug("fine-dining")).thenReturn(false);
        when(categoryRepository.findById(parentId)).thenReturn(Optional.of(parentCategory));

        assertThatThrownBy(() -> categoryService.createCategory(request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Parent category is inactive");
    }

    @Test
    @DisplayName("Get all categories returns mapped list")
    void getAllCategories_returnsList() {
        when(categoryRepository.findAll()).thenReturn(List.of(parentCategory));

        List<CategoryResponse> list = categoryService.getAllCategories();
        assertThat(list).hasSize(1);
        assertThat(list.get(0).name()).isEqualTo("Dining");
    }

    @Test
    @DisplayName("Get discovery categories returns only active categories ordered by displayOrder")
    void getDiscoveryCategories_success() {
        when(categoryRepository.findByStatusOrderByDisplayOrderAsc(CategoryStatus.ACTIVE))
                .thenReturn(List.of(parentCategory));

        List<CategoryResponse> list = categoryService.getDiscoveryCategories(CategoryStatus.ACTIVE);
        assertThat(list).hasSize(1);
        assertThat(list.get(0).name()).isEqualTo("Dining");
    }

    @Test
    @DisplayName("Get discovery category by ID returns category if active")
    void getDiscoveryCategoryById_success() {
        when(categoryRepository.findById(parentId)).thenReturn(Optional.of(parentCategory));

        CategoryResponse res = categoryService.getDiscoveryCategoryById(parentId);
        assertThat(res).isNotNull();
        assertThat(res.name()).isEqualTo("Dining");
    }

    @Test
    @DisplayName("Get discovery category throws 404 if category is inactive")
    void getDiscoveryCategoryById_inactive_throwsNotFound() {
        parentCategory.setStatus(CategoryStatus.INACTIVE);
        when(categoryRepository.findById(parentId)).thenReturn(Optional.of(parentCategory));

        assertThatThrownBy(() -> categoryService.getDiscoveryCategoryById(parentId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Update category succeeds")
    void updateCategory_success() {
        UpdateCategoryRequest request = new UpdateCategoryRequest("Fine Dining", null, CategoryStatus.ACTIVE);
        when(categoryRepository.findById(parentId)).thenReturn(Optional.of(parentCategory));
        when(categoryRepository.existsByNameIgnoreCase("Fine Dining")).thenReturn(false);
        when(categoryRepository.existsBySlug("fine-dining")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        CategoryResponse response = categoryService.updateCategory(parentId, request);
        assertThat(response.name()).isEqualTo("Fine Dining");
        assertThat(response.slug()).isEqualTo("fine-dining");
    }

    @Test
    @DisplayName("Deactivate category performs logical deactivation")
    void deactivateCategory_success() {
        when(categoryRepository.findById(parentId)).thenReturn(Optional.of(parentCategory));
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        categoryService.deactivateCategoryAdmin(parentId, "admin_user");

        assertThat(parentCategory.getStatus()).isEqualTo(CategoryStatus.INACTIVE);
        assertThat(parentCategory.getUpdatedBy()).isEqualTo("admin_user");
        verify(categoryRepository).save(parentCategory);
    }
}
