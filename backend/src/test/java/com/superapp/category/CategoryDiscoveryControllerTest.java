package com.superapp.category;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.category.controller.CategoryDiscoveryController;
import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CategoryDiscoveryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private CategoryDiscoveryController controller;

    private UUID catId;
    private CategoryResponse catResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        catId = UUID.randomUUID();
        catResponse = new CategoryResponse(
                catId, "Restaurants", "restaurants", "Restaurants and dining",
                "restaurant", 1, null, null, CategoryStatus.ACTIVE, null, null
        );
    }

    @Test
    @DisplayName("GET /api/v1/discovery/categories returns active categories for customers")
    void getDiscoveryCategories_success() throws Exception {
        when(categoryService.getDiscoveryCategories(null)).thenReturn(List.of(catResponse));

        mockMvc.perform(get("/api/v1/discovery/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Categories fetched successfully"))
                .andExpect(jsonPath("$.data[0].id").value(catId.toString()))
                .andExpect(jsonPath("$.data[0].name").value("Restaurants"))
                .andExpect(jsonPath("$.data[0].slug").value("restaurants"))
                .andExpect(jsonPath("$.data[0].icon").value("restaurant"))
                .andExpect(jsonPath("$.data[0].displayOrder").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/discovery/categories/{id} returns single category")
    void getDiscoveryCategoryById_success() throws Exception {
        when(categoryService.getDiscoveryCategoryById(catId)).thenReturn(catResponse);

        mockMvc.perform(get("/api/v1/discovery/categories/" + catId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(catId.toString()))
                .andExpect(jsonPath("$.data.name").value("Restaurants"))
                .andExpect(jsonPath("$.data.slug").value("restaurants"));
    }
}
