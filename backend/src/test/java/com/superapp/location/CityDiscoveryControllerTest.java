package com.superapp.location;

import com.superapp.location.controller.CityDiscoveryController;
import com.superapp.location.service.CityService;
import com.superapp.store.dto.CityResponse;
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

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CityDiscoveryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CityService cityService;

    @InjectMocks
    private CityDiscoveryController controller;

    private CityResponse cityResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        cityResponse = new CityResponse("city_123", "Nagpur", "nagpur", "Maharashtra", "India", null, null, null);
    }

    @Test
    @DisplayName("GET /api/v1/discovery/cities returns list of active cities")
    void getDiscoveryCities_success() throws Exception {
        when(cityService.getDiscoveryCities()).thenReturn(List.of(cityResponse));

        mockMvc.perform(get("/api/v1/discovery/cities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Cities fetched successfully"))
                .andExpect(jsonPath("$.data[0].id").value("city_123"))
                .andExpect(jsonPath("$.data[0].name").value("Nagpur"))
                .andExpect(jsonPath("$.data[0].slug").value("nagpur"))
                .andExpect(jsonPath("$.data[0].state").value("Maharashtra"))
                .andExpect(jsonPath("$.data[0].country").value("India"));
    }

    @Test
    @DisplayName("GET /api/v1/discovery/cities/{cityId} returns active city")
    void getDiscoveryCityById_success() throws Exception {
        when(cityService.getDiscoveryCityById("city_123")).thenReturn(cityResponse);

        mockMvc.perform(get("/api/v1/discovery/cities/city_123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("city_123"))
                .andExpect(jsonPath("$.data.name").value("Nagpur"));
    }
}
