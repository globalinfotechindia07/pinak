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

    @Test
    @DisplayName("GET /api/v1/discovery/states returns distinct states list")
    void getDiscoveryStates_success() throws Exception {
        when(cityService.getDiscoveryStates()).thenReturn(List.of("Gujarat", "Maharashtra"));

        mockMvc.perform(get("/api/v1/discovery/states"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0]").value("Gujarat"))
                .andExpect(jsonPath("$.data[1]").value("Maharashtra"));
    }

    @Test
    @DisplayName("GET /api/v1/discovery/cities?state=Maharashtra filters cities by state")
    void getDiscoveryCities_filteredByState() throws Exception {
        when(cityService.getDiscoveryCities("Maharashtra")).thenReturn(List.of(cityResponse));

        mockMvc.perform(get("/api/v1/discovery/cities").param("state", "Maharashtra"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].state").value("Maharashtra"));
    }

    @Test
    @DisplayName("GET /api/v1/discovery/districts returns districts list for state")
    void getDistricts_success() throws Exception {
        when(cityService.getDistrictsForState("Maharashtra")).thenReturn(List.of("Nagpur", "Pune"));

        mockMvc.perform(get("/api/v1/discovery/districts").param("state", "Maharashtra"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0]").value("Nagpur"))
                .andExpect(jsonPath("$.data[1]").value("Pune"));
    }

    @Test
    @DisplayName("GET /api/v1/mobile/locations/districts returns districts via mobile location route")
    void getDistricts_mobileRoute_success() throws Exception {
        when(cityService.getDistrictsForState("Gujarat")).thenReturn(List.of("Ahmedabad", "Surat"));

        mockMvc.perform(get("/api/v1/mobile/locations/districts").param("state", "Gujarat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0]").value("Ahmedabad"))
                .andExpect(jsonPath("$.data[1]").value("Surat"));
    }

    @Test
    @DisplayName("GET /api/v1/discovery/cities/names returns city strings for state and district")
    void getCityNames_success() throws Exception {
        when(cityService.getCitiesForDistrictOrState("Maharashtra", "Nagpur")).thenReturn(List.of("Kamptee", "Nagpur"));

        mockMvc.perform(get("/api/v1/discovery/cities/names")
                        .param("state", "Maharashtra")
                        .param("district", "Nagpur"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0]").value("Kamptee"))
                .andExpect(jsonPath("$.data[1]").value("Nagpur"));
    }

    @Test
    @DisplayName("GET /api/v1/mobile/locations/pincode/380015 returns auto-filled state, district, and city")
    void lookupPincode_success() throws Exception {
        CityService.PincodeLookupResponse pincodeResp = new CityService.PincodeLookupResponse(
                "380015",
                "Gujarat",
                "Ahmedabad",
                "Ahmedabad",
                List.of("Ahmedabad", "Surat"),
                List.of("Ahmedabad", "Sanand")
        );
        when(cityService.lookupPincode("380015")).thenReturn(pincodeResp);

        mockMvc.perform(get("/api/v1/mobile/locations/pincode/380015"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.pincode").value("380015"))
                .andExpect(jsonPath("$.data.state").value("Gujarat"))
                .andExpect(jsonPath("$.data.district").value("Ahmedabad"))
                .andExpect(jsonPath("$.data.city").value("Ahmedabad"))
                .andExpect(jsonPath("$.data.availableDistricts[0]").value("Ahmedabad"))
                .andExpect(jsonPath("$.data.availableCities[0]").value("Ahmedabad"));
    }
}
