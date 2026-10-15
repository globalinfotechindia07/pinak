package com.superapp.mobile.controller;

import com.superapp.category.dto.CategoryResponse;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.mobile.dto.MobileDtos.*;
import com.superapp.mobile.service.MobileAppService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class MobileAppControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MobileAppService mobileAppService;

    @InjectMocks
    private MobileAppController mobileAppController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(mobileAppController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/mobile/categories - Returns active mobile categories")
    void testGetMobileCategories_Success() throws Exception {
        UUID foodId = UUID.randomUUID();
        CategoryResponse food = new CategoryResponse(
                foodId, "Food & Dining", "food-and-dining", "Restaurants & Food", "food-icon", 1,
                null, null, CategoryStatus.ACTIVE, null, null
        );

        when(mobileAppService.getMobileCategories()).thenReturn(List.of(food));

        mockMvc.perform(get("/api/v1/mobile/categories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(foodId.toString()))
                .andExpect(jsonPath("$.data[0].name").value("Food & Dining"))
                .andExpect(jsonPath("$.data[0].slug").value("food-and-dining"));
    }

    @Test
    @DisplayName("GET /api/v1/mobile/location/radar-preview - Returns geo-radar preview")
    void testGetRadarPreview_Success() throws Exception {
        RadarPreviewResponse preview = new RadarPreviewResponse(
                "Indiranagar, Bangalore",
                38L,
                "Up to 50% OFF live right now",
                5.0,
                List.of(new NearbyStoreCardDto(
                        UUID.randomUUID(), "Brew & Bites Cafe", "120m away", true, "30% OFF", 4.9
                )),
                new PrivacyShieldDto(true, false, "NPCI & RBI compliance grade encryption")
        );

        when(mobileAppService.getRadarPreview(any(), any())).thenReturn(preview);

        mockMvc.perform(get("/api/v1/mobile/location/radar-preview")
                        .param("lat", "12.9716")
                        .param("lng", "77.6412")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.detectedZone").value("Indiranagar, Bangalore"))
                .andExpect(jsonPath("$.data.nearbyMerchantCount").value(38));
    }
}
