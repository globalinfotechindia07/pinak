package com.superapp.category;

import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.dto.CreateCategoryRequest;
import com.superapp.category.dto.UpdateCategoryRequest;
import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.category.service.CategoryServiceImpl;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
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

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private UUID parentId;
    private Category parentCategory;

    @BeforeEach
    void setUp() {
        parentId = UUID.randomUUID();
        parentCategory = new Category("Dining", null, CategoryStatus.ACTIVE);
        parentCategory.setId(parentId);
    }

    @Test
    @DisplayName("Create top-level category succeeds")
    void createCategory_topLevel_success() {
        CreateCategoryRequest request = new CreateCategoryRequest("Dining", null, CategoryStatus.ACTIVE);

        when(categoryRepository.existsByNameIgnoreCase("Dining")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category c = invocation.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CategoryResponse response = categoryService.createCategory(request);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Dining");
        assertThat(response.parentId()).isNull();
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("Create child category with valid parent succeeds")
    void createCategory_child_success() {
        UUID childId = UUID.randomUUID();
        CreateCategoryRequest request = new CreateCategoryRequest("Cafes", parentId, CategoryStatus.ACTIVE);

        when(categoryRepository.existsByNameIgnoreCase("Cafes")).thenReturn(false);
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
    @DisplayName("Create duplicate category throws DuplicateResourceException")
    void createCategory_duplicate_throwsException() {
        CreateCategoryRequest request = new CreateCategoryRequest("Dining", null, CategoryStatus.ACTIVE);
        when(categoryRepository.existsByNameIgnoreCase("Dining")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(request))
                .isInstanceOf(DuplicateResourceException.class);
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
    @DisplayName("Update category succeeds")
    void updateCategory_success() {
        UpdateCategoryRequest request = new UpdateCategoryRequest("Fine Dining", null, CategoryStatus.ACTIVE);
        when(categoryRepository.findById(parentId)).thenReturn(Optional.of(parentCategory));
        when(categoryRepository.existsByNameIgnoreCase("Fine Dining")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        CategoryResponse response = categoryService.updateCategory(parentId, request);
        assertThat(response.name()).isEqualTo("Fine Dining");
    }

    @Test
    @DisplayName("Delete category unlinks children and deletes")
    void deleteCategory_success() {
        when(categoryRepository.findById(parentId)).thenReturn(Optional.of(parentCategory));
        when(categoryRepository.findByParentId(parentId)).thenReturn(List.of());

        categoryService.deleteCategory(parentId);
        verify(categoryRepository).delete(parentCategory);
    }
}
