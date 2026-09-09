package com.superapp.category;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.category.controller.CategoryController;
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

import java.time.Instant;
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
class CategoryControllerUnitTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock private CategoryService categoryService;
    @InjectMocks private CategoryController categoryController;

    private UUID categoryId;
    private CategoryResponse categoryResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(categoryController).build();
        categoryId = UUID.randomUUID();
        categoryResponse = new CategoryResponse(
                categoryId, "Food & Dining", null, null,
                CategoryStatus.ACTIVE, Instant.now(), Instant.now()
        );
    }

    @Test
    @DisplayName("POST /api/v1/categories creates category and returns 201 CREATED")
    void createCategory_success() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest("Food & Dining", null, CategoryStatus.ACTIVE);
        when(categoryService.createCategory(any(CreateCategoryRequest.class))).thenReturn(categoryResponse);

        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Food & Dining"));
    }

    @Test
    @DisplayName("GET /api/v1/categories returns list with 200 OK")
    void getAllCategories_success() throws Exception {
        when(categoryService.getAllCategories()).thenReturn(List.of(categoryResponse));

        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(categoryId.toString()));
    }

    @Test
    @DisplayName("GET /api/v1/categories/{id} returns single category with 200 OK")
    void getCategoryById_success() throws Exception {
        when(categoryService.getCategoryById(categoryId)).thenReturn(categoryResponse);

        mockMvc.perform(get("/api/v1/categories/" + categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(categoryId.toString()));
    }

    @Test
    @DisplayName("PUT /api/v1/categories/{id} updates category with 200 OK")
    void updateCategory_success() throws Exception {
        UpdateCategoryRequest request = new UpdateCategoryRequest("Fine Dining", null, CategoryStatus.ACTIVE);
        CategoryResponse updated = new CategoryResponse(
                categoryId, "Fine Dining", null, null,
                CategoryStatus.ACTIVE, Instant.now(), Instant.now()
        );
        when(categoryService.updateCategory(eq(categoryId), any(UpdateCategoryRequest.class))).thenReturn(updated);

        mockMvc.perform(put("/api/v1/categories/" + categoryId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Fine Dining"));
    }

    @Test
    @DisplayName("DELETE /api/v1/categories/{id} deletes category with 200 OK")
    void deleteCategory_success() throws Exception {
        doNothing().when(categoryService).deleteCategory(categoryId);

        mockMvc.perform(delete("/api/v1/categories/" + categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
