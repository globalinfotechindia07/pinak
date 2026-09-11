package com.superapp.category;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.category.controller.AdminCategoryController;
import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.dto.CreateCategoryRequest;
import com.superapp.category.dto.UpdateCategoryRequest;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminCategoryControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private AdminCategoryController adminCategoryController;

    private UUID catId;
    private CategoryResponse catResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminCategoryController).build();
        catId = UUID.randomUUID();
        catResponse = new CategoryResponse(
                catId, "Restaurants", "restaurants", "Restaurants and dining",
                "restaurant", 1, null, null, CategoryStatus.ACTIVE, null, null
        );
    }

    @Test
    @DisplayName("POST /api/v1/admin/categories creates category and returns 201 Created")
    void createCategory_admin_success() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest("Restaurants", "restaurants", "Restaurants and dining", "restaurant", 1);
        when(categoryService.createCategoryAdmin(any(CreateCategoryRequest.class), any())).thenReturn(catResponse);

        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Category created successfully"))
                .andExpect(jsonPath("$.data.name").value("Restaurants"))
                .andExpect(jsonPath("$.data.slug").value("restaurants"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("GET /api/v1/admin/categories returns all categories with 200 OK")
    void getAllCategories_admin_success() throws Exception {
        when(categoryService.getAllCategoriesAdmin()).thenReturn(List.of(catResponse));

        mockMvc.perform(get("/api/v1/admin/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(catId.toString()));
    }

    @Test
    @DisplayName("GET /api/v1/admin/categories/{id} returns category with 200 OK")
    void getCategoryById_admin_success() throws Exception {
        when(categoryService.getCategoryByIdAdmin(catId)).thenReturn(catResponse);

        mockMvc.perform(get("/api/v1/admin/categories/" + catId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(catId.toString()));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/categories/{id} updates category with 200 OK")
    void updateCategory_admin_success() throws Exception {
        UpdateCategoryRequest request = new UpdateCategoryRequest("Restaurants & Cafes", "restaurants-cafes", "Restaurants and cafes", "restaurant", 1);
        CategoryResponse updated = new CategoryResponse(
                catId, "Restaurants & Cafes", "restaurants-cafes", "Restaurants and cafes",
                "restaurant", 1, null, null, CategoryStatus.ACTIVE, null, null
        );
        when(categoryService.updateCategoryAdmin(eq(catId), any(UpdateCategoryRequest.class), any())).thenReturn(updated);

        mockMvc.perform(put("/api/v1/admin/categories/" + catId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Category updated successfully"))
                .andExpect(jsonPath("$.data.name").value("Restaurants & Cafes"))
                .andExpect(jsonPath("$.data.slug").value("restaurants-cafes"));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/categories/{id} deactivates category and returns 204 No Content")
    void deleteCategory_admin_returns204() throws Exception {
        doNothing().when(categoryService).deactivateCategoryAdmin(eq(catId), any());

        mockMvc.perform(delete("/api/v1/admin/categories/" + catId))
                .andExpect(status().isNoContent());
    }
}
