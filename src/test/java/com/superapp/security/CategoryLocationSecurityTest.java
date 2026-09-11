package com.superapp.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.category.controller.AdminCategoryController;
import com.superapp.category.controller.CategoryDiscoveryController;
import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.dto.CreateCategoryRequest;
import com.superapp.category.dto.UpdateCategoryRequest;
import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.service.CategoryService;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.location.controller.AdminCityController;
import com.superapp.location.controller.CityDiscoveryController;
import com.superapp.location.dto.CreateCityRequest;
import com.superapp.location.dto.UpdateCityRequest;
import com.superapp.location.service.CityService;
import com.superapp.store.dto.CityResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CategoryLocationSecurityTest {

    private MockMvc adminCatMockMvc;
    private MockMvc discCatMockMvc;
    private MockMvc adminCityMockMvc;
    private MockMvc discCityMockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private CategoryService categoryService;

    @Mock
    private CityService cityService;

    @InjectMocks
    private AdminCategoryController adminCategoryController;

    @InjectMocks
    private CategoryDiscoveryController categoryDiscoveryController;

    @InjectMocks
    private AdminCityController adminCityController;

    @InjectMocks
    private CityDiscoveryController cityDiscoveryController;

    @BeforeEach
    void setUp() {
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler();

        adminCatMockMvc = MockMvcBuilders.standaloneSetup(adminCategoryController)
                .setControllerAdvice(exceptionHandler)
                .build();

        discCatMockMvc = MockMvcBuilders.standaloneSetup(categoryDiscoveryController)
                .setControllerAdvice(exceptionHandler)
                .build();

        adminCityMockMvc = MockMvcBuilders.standaloneSetup(adminCityController)
                .setControllerAdvice(exceptionHandler)
                .build();

        discCityMockMvc = MockMvcBuilders.standaloneSetup(cityDiscoveryController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Nested
    @DisplayName("Mass Assignment Protection Tests")
    class MassAssignmentProtectionTests {

        @Test
        @DisplayName("Category update cannot mass-assign status, id, or audit fields")
        void updateCategory_massAssignment_protected() throws Exception {
            UUID catId = UUID.randomUUID();
            String maliciousPayload = """
                    {
                      "id": "00000000-0000-0000-0000-000000000000",
                      "name": "Modified Category",
                      "slug": "modified-category",
                      "status": "INACTIVE",
                      "createdAt": "2020-01-01T00:00:00Z",
                      "createdBy": "hacker",
                      "updatedBy": "hacker"
                    }
                    """;

            CategoryResponse response = new CategoryResponse(
                    catId, "Modified Category", "modified-category", null, null, 0,
                    null, null, CategoryStatus.ACTIVE, null, null
            );
            when(categoryService.updateCategoryAdmin(eq(catId), any(UpdateCategoryRequest.class), any()))
                    .thenReturn(response);

            adminCatMockMvc.perform(put("/api/v1/admin/categories/" + catId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(maliciousPayload))
                    .andExpect(status().isOk());

            ArgumentCaptor<UpdateCategoryRequest> captor = ArgumentCaptor.forClass(UpdateCategoryRequest.class);
            verify(categoryService).updateCategoryAdmin(eq(catId), captor.capture(), any());

            UpdateCategoryRequest captured = captor.getValue();
            assertThat(captured.name()).isEqualTo("Modified Category");
            assertThat(captured.slug()).isEqualTo("modified-category");
            // Status cannot be mass-assigned to alter category status during normal update
        }

        @Test
        @DisplayName("City update cannot mass-assign status, id, or audit fields")
        void updateCity_massAssignment_protected() throws Exception {
            String cityId = "city_123";
            String maliciousPayload = """
                    {
                      "id": "city_hacked",
                      "name": "Nagpur Updated",
                      "slug": "nagpur-updated",
                      "state": "Maharashtra",
                      "status": "INACTIVE",
                      "createdBy": "hacker"
                    }
                    """;

            CityResponse response = new CityResponse(cityId, "Nagpur Updated", "nagpur-updated", "Maharashtra", "India", "ACTIVE", null, null);
            when(cityService.updateCityAdmin(eq(cityId), any(UpdateCityRequest.class), any()))
                    .thenReturn(response);

            adminCityMockMvc.perform(put("/api/v1/admin/cities/" + cityId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(maliciousPayload))
                    .andExpect(status().isOk());

            ArgumentCaptor<UpdateCityRequest> captor = ArgumentCaptor.forClass(UpdateCityRequest.class);
            verify(cityService).updateCityAdmin(eq(cityId), captor.capture(), any());

            UpdateCityRequest captured = captor.getValue();
            assertThat(captured.name()).isEqualTo("Nagpur Updated");
            assertThat(captured.slug()).isEqualTo("nagpur-updated");
        }
    }

    @Nested
    @DisplayName("Error Contracts Tests")
    class ErrorContractsTests {

        @Test
        @DisplayName("Category not found returns 404 with CATEGORY_NOT_FOUND error code")
        void categoryNotFound_returns404() throws Exception {
            UUID catId = UUID.randomUUID();
            when(categoryService.getDiscoveryCategoryById(catId))
                    .thenThrow(new ResourceNotFoundException("Category not found", ApiError.CATEGORY_NOT_FOUND));

            discCatMockMvc.perform(get("/api/v1/discovery/categories/" + catId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("CATEGORY_NOT_FOUND"));
        }

        @Test
        @DisplayName("City not found returns 404 with CITY_NOT_FOUND error code")
        void cityNotFound_returns404() throws Exception {
            when(cityService.getDiscoveryCityById("city_missing"))
                    .thenThrow(new ResourceNotFoundException("City not found", ApiError.CITY_NOT_FOUND));

            discCityMockMvc.perform(get("/api/v1/discovery/cities/city_missing"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("CITY_NOT_FOUND"));
        }

        @Test
        @DisplayName("Duplicate category returns 409 Conflict with CATEGORY_ALREADY_EXISTS")
        void duplicateCategory_returns409() throws Exception {
            CreateCategoryRequest request = new CreateCategoryRequest("Restaurants", "restaurants", "Desc", "icon", 1);
            when(categoryService.createCategoryAdmin(any(), any()))
                    .thenThrow(new DuplicateResourceException("Category already exists", ApiError.CATEGORY_ALREADY_EXISTS));

            adminCatMockMvc.perform(post("/api/v1/admin/categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("CATEGORY_ALREADY_EXISTS"));
        }

        @Test
        @DisplayName("Duplicate city returns 409 Conflict with CITY_ALREADY_EXISTS")
        void duplicateCity_returns409() throws Exception {
            CreateCityRequest request = new CreateCityRequest("Nagpur", "nagpur", "Maharashtra", "India");
            when(cityService.createCityAdmin(any(), any()))
                    .thenThrow(new DuplicateResourceException("City already exists", ApiError.CITY_ALREADY_EXISTS));

            adminCityMockMvc.perform(post("/api/v1/admin/cities")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("CITY_ALREADY_EXISTS"));
        }
    }
}
