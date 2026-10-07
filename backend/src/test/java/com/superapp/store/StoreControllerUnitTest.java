package com.superapp.store;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.store.controller.StoreController;
import com.superapp.store.dto.CreateStoreRequest;
import com.superapp.store.dto.StoreResponse;
import com.superapp.store.dto.UpdateStoreRequest;
import com.superapp.store.service.StoreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StoreControllerUnitTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock private StoreService storeService;
    @InjectMocks private StoreController storeController;

    private UUID storeId;
    private UUID merchantId;
    private UUID ownerId;
    private StoreResponse storeResponse;

    @BeforeEach
    void setUp() {
        storeId = UUID.randomUUID();
        merchantId = UUID.randomUUID();
        ownerId = UUID.randomUUID();

        storeResponse = new StoreResponse(
                storeId, merchantId, "ABC Brands", "Pune Branch",
                "123 Main St", "PUNE", "Maharashtra", "411001",
                new BigDecimal("18.5204"), new BigDecimal("73.8567"),
                ApprovalStatus.PENDING, null, Instant.now(), Instant.now()
        );

        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User(ownerId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_MERCHANT")));
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(storeController)
                .setCustomArgumentResolvers(authPrincipalResolver, new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/stores creates store and returns 201 CREATED")
    void createStore_success() throws Exception {
        CreateStoreRequest request = new CreateStoreRequest(
                merchantId, "Pune Branch", "123 Main St", "PUNE", "Maharashtra", "411001",
                new BigDecimal("18.5204"), new BigDecimal("73.8567")
        );

        when(storeService.createStore(any(CreateStoreRequest.class), eq(ownerId), eq(false)))
                .thenReturn(storeResponse);

        mockMvc.perform(post("/api/v1/stores")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.storeName").value("Pune Branch"))
                .andExpect(jsonPath("$.data.latitude").value(18.5204));
    }

    @Test
    @DisplayName("GET /api/v1/stores/{id} returns store with 200 OK")
    void getStoreById_success() throws Exception {
        when(storeService.getStoreById(storeId)).thenReturn(storeResponse);

        mockMvc.perform(get("/api/v1/stores/" + storeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(storeId.toString()));
    }

    @Test
    @DisplayName("GET /api/v1/stores/nearby returns nearby stores within radius with 200 OK")
    void findNearbyStores_success() throws Exception {
        StoreResponse nearbyResponse = new StoreResponse(
                storeId, merchantId, "ABC Brands", "Pune Branch",
                "123 Main St", "PUNE", "Maharashtra", "411001",
                new BigDecimal("18.5204"), new BigDecimal("73.8567"),
                ApprovalStatus.APPROVED, 1250.5, Instant.now(), Instant.now()
        );

        when(storeService.findNearbyStores(anyDouble(), anyDouble(), anyDouble(), any()))
                .thenReturn(new PageImpl<>(List.of(nearbyResponse), org.springframework.data.domain.PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/stores/nearby")
                        .param("latitude", "18.5204")
                        .param("longitude", "73.8567")
                        .param("radiusMeters", "5000.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].distanceMeters").value(1250.5));
    }

    @Test
    @DisplayName("PATCH /api/v1/stores/{id}/status updates approval status with 200 OK")
    void updateApprovalStatus_success() throws Exception {
        UpdateApprovalStatusRequest request = new UpdateApprovalStatusRequest(ApprovalStatus.APPROVED, "Verified");
        StoreResponse approvedResponse = new StoreResponse(
                storeId, merchantId, "ABC Brands", "Pune Branch",
                "123 Main St", "PUNE", "Maharashtra", "411001",
                new BigDecimal("18.5204"), new BigDecimal("73.8567"),
                ApprovalStatus.APPROVED, null, Instant.now(), Instant.now()
        );

        when(storeService.updateApprovalStatus(eq(storeId), any(UpdateApprovalStatusRequest.class)))
                .thenReturn(approvedResponse);

        mockMvc.perform(patch("/api/v1/stores/" + storeId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
    }
}
