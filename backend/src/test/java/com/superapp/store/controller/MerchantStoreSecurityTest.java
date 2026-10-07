package com.superapp.store.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.common.response.ApiError;
import com.superapp.store.dto.*;
import com.superapp.store.entity.Store;
import com.superapp.store.service.StoreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.PageImpl;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class MerchantStoreSecurityTest {

    private MockMvc merchantMockMvc;
    private MockMvc adminMockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private StoreService storeService;

    @InjectMocks
    private MerchantStoreController merchantStoreController;

    @InjectMocks
    private AdminStoreController adminStoreController;

    private static final String AUTHENTICATED_MERCHANT_USER_ID = "11111111-1111-1111-1111-111111111111";
    private static final String ADMIN_USER_ID = "99999999-9999-9999-9999-999999999999";
    private static final String ATTACKER_STORE_ID = "22222222-2222-2222-2222-222222222222";

    @BeforeEach
    void setUp() {
        HandlerMethodArgumentResolver merchantResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User(AUTHENTICATED_MERCHANT_USER_ID, "password",
                        List.of(new SimpleGrantedAuthority("ROLE_MERCHANT")));
            }
        };

        HandlerMethodArgumentResolver adminResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User(ADMIN_USER_ID, "password",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
            }
        };

        merchantMockMvc = MockMvcBuilders.standaloneSetup(merchantStoreController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(merchantResolver)
                .build();

        adminMockMvc = MockMvcBuilders.standaloneSetup(adminStoreController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(adminResolver)
                .build();
    }

    @Nested
    @DisplayName("IDOR & Store Ownership Isolation Tests")
    class OwnershipIsolationTests {

        @Test
        @DisplayName("POST /api/v1/merchant/stores ignores any merchantId passed in payload and derives merchant from context")
        void createStore_ignoresInjectedMerchantId() throws Exception {
            UUID authId = UUID.fromString(AUTHENTICATED_MERCHANT_USER_ID);
            StoreResponse mockResponse = new StoreResponse(
                    UUID.randomUUID().toString(),
                    UUID.randomUUID().toString(),
                    "Organic Store",
                    "Dharampeth Branch",
                    "Dharampeth Branch",
                    "Main branch",
                    "123 Main Road",
                    "Near Market",
                    "123 Main Road, Near Market",
                    "PUNE",
                    "Pune",
                    "Maharashtra",
                    "440010",
                    new BigDecimal("21.1458"),
                    new BigDecimal("79.0882"),
                    "+919876543210",
                    "ACTIVE",
                    "PENDING_APPROVAL",
                    null,
                    null,
                    null,
                    null,
                    Instant.now(),
                    Instant.now()
            );

            ArgumentCaptor<MerchantCreateStoreRequest> captor = ArgumentCaptor.forClass(MerchantCreateStoreRequest.class);
            when(storeService.createMerchantStore(captor.capture(), eq(authId))).thenReturn(mockResponse);

            // Attempt injecting malicious merchantId
            String payload = """
                    {
                      "merchantId": "00000000-0000-0000-0000-000000000000",
                      "name": "Dharampeth Branch",
                      "description": "Main branch",
                      "addressLine1": "123 Main Road",
                      "addressLine2": "Near Market",
                      "cityId": "PUNE",
                      "state": "Maharashtra",
                      "pincode": "440010",
                      "latitude": 21.1458,
                      "longitude": 79.0882,
                      "phone": "+919876543210"
                    }
                    """;

            merchantMockMvc.perform(post("/api/v1/merchant/stores")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Dharampeth Branch"))
                    .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                    .andExpect(jsonPath("$.data.approvalStatus").value("PENDING_APPROVAL"));

            verify(storeService).createMerchantStore(any(MerchantCreateStoreRequest.class), eq(authId));
        }

        @Test
        @DisplayName("GET /api/v1/merchant/stores/{id} returns 403 STORE_ACCESS_DENIED when store belongs to another merchant")
        void getStore_otherMerchantStore_returns403() throws Exception {
            UUID authId = UUID.fromString(AUTHENTICATED_MERCHANT_USER_ID);
            UUID victimStoreId = UUID.fromString(ATTACKER_STORE_ID);

            when(storeService.getMerchantStoreById(victimStoreId, authId))
                    .thenThrow(new AppException("You do not have permission to access this store", ApiError.STORE_ACCESS_DENIED, 403));

            merchantMockMvc.perform(get("/api/v1/merchant/stores/{storeId}", victimStoreId))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("STORE_ACCESS_DENIED"));
        }

        @Test
        @DisplayName("PUT /api/v1/merchant/stores/{id} prevents mass assignment of id, merchantId, status, approvalStatus")
        void updateStore_preventsMassAssignment() throws Exception {
            UUID authId = UUID.fromString(AUTHENTICATED_MERCHANT_USER_ID);
            UUID storeId = UUID.randomUUID();

            StoreResponse mockResponse = new StoreResponse(
                    storeId.toString(),
                    UUID.randomUUID().toString(),
                    "Organic Store",
                    "Updated Branch",
                    "Updated Branch",
                    null,
                    "456 Main Road",
                    null,
                    "456 Main Road",
                    "PUNE",
                    "Pune",
                    "Maharashtra",
                    "440010",
                    new BigDecimal("21.1459"),
                    new BigDecimal("79.0883"),
                    "+919876543210",
                    "ACTIVE",
                    "PENDING_APPROVAL",
                    null,
                    null,
                    null,
                    null,
                    Instant.now(),
                    Instant.now()
            );

            ArgumentCaptor<MerchantUpdateStoreRequest> captor = ArgumentCaptor.forClass(MerchantUpdateStoreRequest.class);
            when(storeService.updateMerchantStore(eq(storeId), captor.capture(), eq(authId))).thenReturn(mockResponse);

            // Attempting mass assignment of id, merchantId, status, approvalStatus
            String maliciousPayload = """
                    {
                      "id": "00000000-0000-0000-0000-000000000000",
                      "merchantId": "00000000-0000-0000-0000-000000000000",
                      "name": "Updated Branch",
                      "addressLine1": "456 Main Road",
                      "cityId": "PUNE",
                      "state": "Maharashtra",
                      "pincode": "440010",
                      "latitude": 21.1459,
                      "longitude": 79.0883,
                      "phone": "+919876543210",
                      "status": "SUSPENDED",
                      "approvalStatus": "APPROVED"
                    }
                    """;

            merchantMockMvc.perform(put("/api/v1/merchant/stores/{storeId}", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(maliciousPayload))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Updated Branch"));

            MerchantUpdateStoreRequest captured = captor.getValue();
            assertThat(captured.name()).isEqualTo("Updated Branch");
            assertThat(captured.addressLine1()).isEqualTo("456 Main Road");
        }
    }

    @Nested
    @DisplayName("Geographic & Coordinate Validation Tests")
    class LocationValidationTests {

        @Test
        @DisplayName("POST /api/v1/merchant/stores rejects latitude outside [-90, 90]")
        void createStore_invalidLatitude_returns400() throws Exception {
            String payload = """
                    {
                      "name": "Bad Coordinates Store",
                      "addressLine1": "123 Main Road",
                      "cityId": "PUNE",
                      "state": "Maharashtra",
                      "pincode": "440010",
                      "latitude": 95.1234,
                      "longitude": 79.0882
                    }
                    """;

            merchantMockMvc.perform(post("/api/v1/merchant/stores")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
        }

        @Test
        @DisplayName("POST /api/v1/merchant/stores rejects longitude outside [-180, 180]")
        void createStore_invalidLongitude_returns400() throws Exception {
            String payload = """
                    {
                      "name": "Bad Coordinates Store",
                      "addressLine1": "123 Main Road",
                      "cityId": "PUNE",
                      "state": "Maharashtra",
                      "pincode": "440010",
                      "latitude": 21.1458,
                      "longitude": 185.0000
                    }
                    """;

            merchantMockMvc.perform(post("/api/v1/merchant/stores")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
        }

        @Test
        @DisplayName("PostGIS point generation places longitude FIRST and latitude SECOND")
        void postgisFormat_longitudeFirstLatitudeSecond() {
            BigDecimal lat = new BigDecimal("21.1458");
            BigDecimal lng = new BigDecimal("79.0882");
            String wkt = Store.formatWkt(lng, lat);

            assertThat(wkt).isEqualTo("POINT(79.0882 21.1458)");
        }
    }

    @Nested
    @DisplayName("Admin Workflow & State Transitions")
    class AdminWorkflowTests {

        @Test
        @DisplayName("POST /api/v1/admin/stores/{id}/approve approves pending store")
        void approveStore_success() throws Exception {
            UUID storeId = UUID.randomUUID();
            UUID adminId = UUID.fromString(ADMIN_USER_ID);
            StoreApprovalActionResponse actionResponse = StoreApprovalActionResponse.approved(storeId.toString());

            when(storeService.approveStore(eq(storeId), eq(adminId))).thenReturn(actionResponse);

            adminMockMvc.perform(post("/api/v1/admin/stores/{id}/approve", storeId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"))
                    .andExpect(jsonPath("$.data.status").value("ACTIVE"));

            verify(storeService).approveStore(eq(storeId), eq(adminId));
        }

        @Test
        @DisplayName("POST /api/v1/admin/stores/{id}/approve on already approved store returns 409 CONFLICT")
        void approveStore_alreadyApproved_returns409() throws Exception {
            UUID storeId = UUID.randomUUID();
            UUID adminId = UUID.fromString(ADMIN_USER_ID);

            when(storeService.approveStore(eq(storeId), eq(adminId)))
                    .thenThrow(new AppException("Store cannot be approved in its current state", ApiError.INVALID_STORE_STATE, 409));

            adminMockMvc.perform(post("/api/v1/admin/stores/{id}/approve", storeId))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("INVALID_STORE_STATE"));
        }

        @Test
        @DisplayName("POST /api/v1/admin/stores/{id}/reject requires non-blank reason")
        void rejectStore_blankReason_returns400() throws Exception {
            UUID storeId = UUID.randomUUID();
            String invalidPayload = """
                    {
                      "reason": "  "
                    }
                    """;

            adminMockMvc.perform(post("/api/v1/admin/stores/{id}/reject", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidPayload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
        }

        @Test
        @DisplayName("POST /api/v1/admin/stores/{id}/reject with reason succeeds")
        void rejectStore_withReason_success() throws Exception {
            UUID storeId = UUID.randomUUID();
            UUID adminId = UUID.fromString(ADMIN_USER_ID);
            StoreApprovalActionResponse actionResponse = StoreApprovalActionResponse.rejected(storeId.toString(), "Invalid store address");

            when(storeService.rejectStore(eq(storeId), eq("Invalid store address"), eq(adminId)))
                    .thenReturn(actionResponse);

            String validPayload = """
                    {
                      "reason": "Invalid store address"
                    }
                    """;

            adminMockMvc.perform(post("/api/v1/admin/stores/{id}/reject", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validPayload))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"))
                    .andExpect(jsonPath("$.data.reason").value("Invalid store address"));
        }

        @Test
        @DisplayName("POST /api/v1/admin/stores/{id}/suspend requires non-blank reason")
        void suspendStore_blankReason_returns400() throws Exception {
            UUID storeId = UUID.randomUUID();
            String invalidPayload = """
                    {
                      "reason": ""
                    }
                    """;

            adminMockMvc.perform(post("/api/v1/admin/stores/{id}/suspend", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidPayload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
        }

        @Test
        @DisplayName("POST /api/v1/admin/stores/{id}/suspend with reason succeeds")
        void suspendStore_withReason_success() throws Exception {
            UUID storeId = UUID.randomUUID();
            UUID adminId = UUID.fromString(ADMIN_USER_ID);
            StoreApprovalActionResponse actionResponse = StoreApprovalActionResponse.suspended(storeId.toString(), "License expired");

            when(storeService.suspendStore(eq(storeId), eq("License expired"), eq(adminId)))
                    .thenReturn(actionResponse);

            String validPayload = """
                    {
                      "reason": "License expired"
                    }
                    """;

            adminMockMvc.perform(post("/api/v1/admin/stores/{id}/suspend", storeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validPayload))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.status").value("SUSPENDED"))
                    .andExpect(jsonPath("$.data.reason").value("License expired"));
        }
    }
}
