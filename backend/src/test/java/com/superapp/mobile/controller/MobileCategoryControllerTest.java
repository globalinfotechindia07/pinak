package com.superapp.mobile.controller;

import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.service.CategoryService;
import com.superapp.common.exception.GlobalExceptionHandler;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class MobileCategoryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private MobileCategoryController mobileCategoryController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(mobileCategoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/mobile/categories - Returns active mobile categories from backend")
    void testGetMobileCategories_Success() throws Exception {
        UUID foodId = UUID.randomUUID();
        CategoryResponse food = new CategoryResponse(
                foodId, "Food & Dining", "food-and-dining", "Restaurants & Food", "food-icon", 1,
                null, null, CategoryStatus.ACTIVE, null, null
        );

        when(categoryService.getDiscoveryCategories(CategoryStatus.ACTIVE)).thenReturn(List.of(food));

        mockMvc.perform(get("/api/v1/mobile/categories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(foodId.toString()))
                .andExpect(jsonPath("$.data[0].name").value("Food & Dining"))
                .andExpect(jsonPath("$.data[0].slug").value("food-and-dining"));
    }
}
