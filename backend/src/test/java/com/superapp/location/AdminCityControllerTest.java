package com.superapp.location;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.location.controller.AdminCityController;
import com.superapp.location.dto.CreateCityRequest;
import com.superapp.location.dto.UpdateCityRequest;
import com.superapp.location.service.CityService;
import com.superapp.store.dto.CityResponse;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminCityControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private CityService cityService;

    @InjectMocks
    private AdminCityController adminCityController;

    private CityResponse cityResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminCityController).build();
        cityResponse = new CityResponse("city_123", "Nagpur", "nagpur", "Maharashtra", "India", "ACTIVE", null, null);
    }

    @Test
    @DisplayName("POST /api/v1/admin/cities creates city and returns 201 Created")
    void createCity_admin_success() throws Exception {
        CreateCityRequest request = new CreateCityRequest("Nagpur", "nagpur", "Maharashtra", "India");
        when(cityService.createCityAdmin(any(CreateCityRequest.class), any())).thenReturn(cityResponse);

        mockMvc.perform(post("/api/v1/admin/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("City created successfully"))
                .andExpect(jsonPath("$.data.name").value("Nagpur"))
                .andExpect(jsonPath("$.data.slug").value("nagpur"))
                .andExpect(jsonPath("$.data.state").value("Maharashtra"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("GET /api/v1/admin/cities returns all cities with 200 OK")
    void getAllCities_admin_success() throws Exception {
        when(cityService.getAllCitiesAdmin()).thenReturn(List.of(cityResponse));

        mockMvc.perform(get("/api/v1/admin/cities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value("city_123"));
    }

    @Test
    @DisplayName("GET /api/v1/admin/cities/{id} returns city with 200 OK")
    void getCityById_admin_success() throws Exception {
        when(cityService.getCityByIdAdmin("city_123")).thenReturn(cityResponse);

        mockMvc.perform(get("/api/v1/admin/cities/city_123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("city_123"));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/cities/{id} updates city with 200 OK")
    void updateCity_admin_success() throws Exception {
        UpdateCityRequest request = new UpdateCityRequest("Nagpur Smart City", "nagpur", "Maharashtra", "India");
        CityResponse updated = new CityResponse("city_123", "Nagpur Smart City", "nagpur", "Maharashtra", "India", "ACTIVE", null, null);
        when(cityService.updateCityAdmin(eq("city_123"), any(UpdateCityRequest.class), any())).thenReturn(updated);

        mockMvc.perform(put("/api/v1/admin/cities/city_123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("City updated successfully"))
                .andExpect(jsonPath("$.data.name").value("Nagpur Smart City"));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/cities/{id} deactivates city and returns 204 No Content")
    void deleteCity_admin_returns204() throws Exception {
        doNothing().when(cityService).deactivateCityAdmin(eq("city_123"), any());

        mockMvc.perform(delete("/api/v1/admin/cities/city_123"))
                .andExpect(status().isNoContent());
    }
}
