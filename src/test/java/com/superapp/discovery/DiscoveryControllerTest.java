package com.superapp.discovery;

import com.superapp.common.exception.AppException;
import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.common.response.PaginationMeta;
import com.superapp.discovery.controller.DiscoveryController;
import com.superapp.discovery.dto.*;
import com.superapp.discovery.service.DiscoveryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DiscoveryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DiscoveryService discoveryService;

    @InjectMocks
    private DiscoveryController discoveryController;

    private UUID storeId;
    private UUID merchantId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(discoveryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        storeId = UUID.randomUUID();
        merchantId = UUID.randomUUID();
    }

    @Test
    @DisplayName("GET /api/v1/discovery/nearby returns 200 with stores and meta")
    void getNearbyStores_success() throws Exception {
        NearbyStoreResponse storeResponse = new NearbyStoreResponse(
                storeId.toString(),
                merchantId.toString(),
                "Super Mart",
                "Super Mart City Center",
                new CategoryRef(UUID.randomUUID().toString(), "Grocery"),
                new AddressRef("Main St", "Pune", "Maharashtra", "411001"),
                new LocationRef(18.5204, 73.8567),
                850.0,
                true
        );

        PaginationMeta meta = PaginationMeta.of(0, 20, 1, 1);
        when(discoveryService.getNearbyStores(any(), any()))
                .thenReturn(PagedResult.of(List.of(storeResponse), meta));

        mockMvc.perform(get("/api/v1/discovery/nearby")
                        .param("lat", "18.5204")
                        .param("lng", "73.8567")
                        .param("radius", "5000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(storeId.toString()))
                .andExpect(jsonPath("$.data[0].name").value("Super Mart City Center"))
                .andExpect(jsonPath("$.data[0].merchantName").value("Super Mart"))
                .andExpect(jsonPath("$.data[0].distanceMeters").value(850.0))
                .andExpect(jsonPath("$.data[0].hasActiveOffers").value(true))
                .andExpect(jsonPath("$.meta.page").value(0))
                .andExpect(jsonPath("$.meta.size").value(20))
                .andExpect(jsonPath("$.meta.totalElements").value(1))
                .andExpect(jsonPath("$.meta.totalPages").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/discovery/nearby with invalid coordinates returns 400 with INVALID_COORDINATES")
    void getNearbyStores_invalidCoordinates_returns400() throws Exception {
        when(discoveryService.getNearbyStores(any(), any()))
                .thenThrow(new AppException("Invalid coordinates", ApiError.INVALID_COORDINATES, 400,
                        List.of(Map.of("field", "lat", "message", "Latitude must be between -90 and 90"))));

        mockMvc.perform(get("/api/v1/discovery/nearby")
                        .param("lat", "95.0")
                        .param("lng", "73.8567"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_COORDINATES"))
                .andExpect(jsonPath("$.error.code").value("INVALID_COORDINATES"))
                .andExpect(jsonPath("$.error.details[0].field").value("lat"));
    }

    @Test
    @DisplayName("GET /api/v1/discovery/search returns 200 with matching stores")
    void searchStores_success() throws Exception {
        StoreSearchResponse searchItem = new StoreSearchResponse(
                storeId.toString(),
                merchantId.toString(),
                "Cafe Coffee Day",
                "CCD Express",
                new CategoryRef(UUID.randomUUID().toString(), "Beverages"),
                new LocationRef(18.5204, 73.8567),
                420.0
        );

        PaginationMeta meta = PaginationMeta.of(0, 20, 1, 1);
        when(discoveryService.searchStores(any(), any()))
                .thenReturn(PagedResult.of(List.of(searchItem), meta));

        mockMvc.perform(get("/api/v1/discovery/search")
                        .param("q", "coffee"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(storeId.toString()))
                .andExpect(jsonPath("$.data[0].name").value("CCD Express"))
                .andExpect(jsonPath("$.meta.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/discovery/stores/{storeId} returns store details")
    void getStoreDetails_success() throws Exception {
        StoreDiscoveryDetailResponse details = new StoreDiscoveryDetailResponse(
                storeId.toString(),
                new MerchantRef(merchantId.toString(), "Lifestyle Retail"),
                "Lifestyle Westend",
                "Trendy fashion and lifestyle store",
                new CategoryRef(UUID.randomUUID().toString(), "Fashion"),
                new AddressRef("Westend Mall", "Aundh", "Pune", "Maharashtra", "411007"),
                new LocationRef(18.5602, 73.8077),
                "+919876543210",
                "ACTIVE"
        );

        when(discoveryService.getStoreDetails(storeId)).thenReturn(details);

        mockMvc.perform(get("/api/v1/discovery/stores/" + storeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(storeId.toString()))
                .andExpect(jsonPath("$.data.name").value("Lifestyle Westend"))
                .andExpect(jsonPath("$.data.merchant.name").value("Lifestyle Retail"))
                .andExpect(jsonPath("$.data.phone").value("+919876543210"));
    }

    @Test
    @DisplayName("GET /api/v1/discovery/stores/{storeId} returns 404 if not found")
    void getStoreDetails_notFound() throws Exception {
        when(discoveryService.getStoreDetails(storeId))
                .thenThrow(new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND));

        mockMvc.perform(get("/api/v1/discovery/stores/" + storeId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("STORE_NOT_FOUND"))
                .andExpect(jsonPath("$.error.code").value("STORE_NOT_FOUND"));
    }

    @Test
    @DisplayName("GET /api/v1/discovery/stores/{storeId}/offers returns active offers")
    void getStoreOffers_success() throws Exception {
        OfferResponse offer = new OfferResponse(
                UUID.randomUUID().toString(),
                "Summer Sale",
                "25% off storewide",
                "PERCENTAGE",
                BigDecimal.valueOf(25),
                Instant.now(),
                Instant.now().plusSeconds(86400),
                "ACTIVE"
        );

        PaginationMeta meta = PaginationMeta.of(0, 20, 1, 1);
        when(discoveryService.getStoreOffers(eq(storeId), anyInt(), anyInt()))
                .thenReturn(PagedResult.of(List.of(offer), meta));

        mockMvc.perform(get("/api/v1/discovery/stores/" + storeId + "/offers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].title").value("Summer Sale"))
                .andExpect(jsonPath("$.data[0].type").value("PERCENTAGE"))
                .andExpect(jsonPath("$.meta.totalElements").value(1));
    }
}
