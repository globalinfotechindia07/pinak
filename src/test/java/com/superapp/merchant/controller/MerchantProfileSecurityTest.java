package com.superapp.merchant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.dto.*;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.KycStatus;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.service.MerchantService;
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
class MerchantProfileSecurityTest {

    private MockMvc profileMockMvc;
    private MockMvc adminMockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private MerchantService merchantService;

    @InjectMocks
    private MerchantProfileController merchantProfileController;

    @InjectMocks
    private AdminMerchantController adminMerchantController;

    private static final String AUTHENTICATED_MERCHANT_USER_ID = "11111111-1111-1111-1111-111111111111";
    private static final String ADMIN_USER_ID = "99999999-9999-9999-9999-999999999999";
    private static final String VICTIM_MERCHANT_ID = "22222222-2222-2222-2222-222222222222";

    @BeforeEach
    void setUp() {
        HandlerMethodArgumentResolver merchantPrincipalResolver = new HandlerMethodArgumentResolver() {
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

        HandlerMethodArgumentResolver adminPrincipalResolver = new HandlerMethodArgumentResolver() {
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

        profileMockMvc = MockMvcBuilders.standaloneSetup(merchantProfileController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(merchantPrincipalResolver)
                .build();

        adminMockMvc = MockMvcBuilders.standaloneSetup(adminMerchantController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(adminPrincipalResolver)
                .build();
    }

    @Nested
    @DisplayName("IDOR & Profile Isolation Tests")
    class ProfileIsolationTests {

        @Test
        @DisplayName("GET /api/v1/merchant/profile strictly uses authenticated user context and ignores injected params")
        void getProfile_strictlyUsesAuthenticatedUser() throws Exception {
            UUID authId = UUID.fromString(AUTHENTICATED_MERCHANT_USER_ID);
            MerchantResponse response = new MerchantResponse(
                    UUID.randomUUID().toString(),
                    authId.toString(),
                    "Organic Store",
                    "Organic Store Pvt Ltd",
                    "Healthy groceries",
                    UUID.randomUUID().toString(),
                    "Groceries",
                    "9876543210",
                    "store@organic.com",
                    "https://organicstore.com",
                    "ACTIVE",
                    "APPROVED",
                    "VERIFIED",
                    Instant.now(),
                    Instant.now()
            );

            when(merchantService.getMerchantProfile(authId)).thenReturn(response);

            profileMockMvc.perform(get("/api/v1/merchant/profile")
                            .param("merchantId", VICTIM_MERCHANT_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.ownerUserId").value(authId.toString()))
                    .andExpect(jsonPath("$.data.businessName").value("Organic Store"));

            verify(merchantService).getMerchantProfile(eq(authId));
            verify(merchantService, never()).getMerchantProfile(eq(UUID.fromString(VICTIM_MERCHANT_ID)));
        }

        @Test
        @DisplayName("PUT /api/v1/merchant/profile prevents mass assignment of security fields")
        void updateProfile_preventsMassAssignment() throws Exception {
            UUID authId = UUID.fromString(AUTHENTICATED_MERCHANT_USER_ID);
            MerchantResponse response = new MerchantResponse(
                    UUID.randomUUID().toString(),
                    authId.toString(),
                    "Updated Organic Store",
                    "Organic Store Pvt Ltd",
                    "Healthy groceries",
                    null,
                    null,
                    "9876543210",
                    "store@organic.com",
                    "https://organicstore.com",
                    "ACTIVE",
                    "PENDING_APPROVAL",
                    "PENDING",
                    Instant.now(),
                    Instant.now()
            );

            ArgumentCaptor<UpdateMerchantProfileRequest> captor = ArgumentCaptor.forClass(UpdateMerchantProfileRequest.class);
            when(merchantService.updateMerchantProfile(captor.capture(), eq(authId))).thenReturn(response);

            // Attempting mass assignment of id, ownerUserId, status, approvalStatus, kycStatus
            String maliciousPayload = """
                    {
                      "id": "00000000-0000-0000-0000-000000000000",
                      "ownerUserId": "00000000-0000-0000-0000-000000000000",
                      "businessName": "Updated Organic Store",
                      "legalName": "Organic Store Pvt Ltd",
                      "description": "Healthy groceries",
                      "phone": "9876543210",
                      "email": "store@organic.com",
                      "website": "https://organicstore.com",
                      "status": "ACTIVE",
                      "approvalStatus": "APPROVED",
                      "kycStatus": "VERIFIED"
                    }
                    """;

            profileMockMvc.perform(put("/api/v1/merchant/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(maliciousPayload))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.businessName").value("Updated Organic Store"));

            UpdateMerchantProfileRequest captured = captor.getValue();
            assertThat(captured.businessName()).isEqualTo("Updated Organic Store");
            assertThat(captured.legalName()).isEqualTo("Organic Store Pvt Ltd");
        }
    }

    @Nested
    @DisplayName("KYC Submission Security Tests")
    class KycSecurityTests {

        @Test
        @DisplayName("POST /api/v1/merchant/kyc binds submission to authenticated user")
        void submitKyc_bindsToAuthenticatedUser() throws Exception {
            UUID authId = UUID.fromString(AUTHENTICATED_MERCHANT_USER_ID);
            MerchantKycResponse kycResponse = new MerchantKycResponse(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "GST_CERTIFICATE",
                    "SUBMITTED",
                    Instant.now()
            );

            when(merchantService.submitKyc(any(MerchantKycRequest.class), eq(authId))).thenReturn(kycResponse);

            String kycPayload = """
                    {
                      "documentType": "GST_CERTIFICATE",
                      "documentNumber": "27AAAAA0000A1Z5",
                      "businessRegistrationNumber": "BRN123456",
                      "taxId": "TAX123456",
                      "documentUrl": "https://docs.superapp.com/gst.pdf"
                    }
                    """;

            profileMockMvc.perform(post("/api/v1/merchant/kyc")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(kycPayload))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.documentType").value("GST_CERTIFICATE"))
                    .andExpect(jsonPath("$.data.status").value("SUBMITTED"));

            verify(merchantService).submitKyc(any(MerchantKycRequest.class), eq(authId));
        }

        @Test
        @DisplayName("POST /api/v1/merchant/kyc fails when required documentType is missing")
        void submitKyc_missingDocumentType_returns400() throws Exception {
            String invalidKycPayload = """
                    {
                      "documentNumber": "27AAAAA0000A1Z5"
                    }
                    """;

            profileMockMvc.perform(post("/api/v1/merchant/kyc")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidKycPayload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
        }
    }

    @Nested
    @DisplayName("Admin Workflow & State Transitions")
    class AdminWorkflowTests {

        @Test
        @DisplayName("POST /api/v1/admin/merchants/{id}/approve approves pending merchant")
        void approveMerchant_success() throws Exception {
            UUID merchantId = UUID.randomUUID();
            UUID adminId = UUID.fromString(ADMIN_USER_ID);
            MerchantApprovalActionResponse actionResponse = MerchantApprovalActionResponse.approved(merchantId.toString());

            when(merchantService.approveMerchant(eq(merchantId), eq(adminId))).thenReturn(actionResponse);

            adminMockMvc.perform(post("/api/v1/admin/merchants/{id}/approve", merchantId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));

            verify(merchantService).approveMerchant(eq(merchantId), eq(adminId));
        }

        @Test
        @DisplayName("POST /api/v1/admin/merchants/{id}/approve on already approved merchant returns 409 CONFLICT")
        void approveMerchant_alreadyApproved_returns409() throws Exception {
            UUID merchantId = UUID.randomUUID();
            UUID adminId = UUID.fromString(ADMIN_USER_ID);

            when(merchantService.approveMerchant(eq(merchantId), eq(adminId)))
                    .thenThrow(new AppException("Merchant cannot be approved in its current state", ApiError.INVALID_MERCHANT_STATE, 409));

            adminMockMvc.perform(post("/api/v1/admin/merchants/{id}/approve", merchantId))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("INVALID_MERCHANT_STATE"));
        }

        @Test
        @DisplayName("POST /api/v1/admin/merchants/{id}/reject requires non-blank reason")
        void rejectMerchant_blankReason_returns400() throws Exception {
            UUID merchantId = UUID.randomUUID();
            String invalidPayload = """
                    {
                      "reason": ""
                    }
                    """;

            adminMockMvc.perform(post("/api/v1/admin/merchants/{id}/reject", merchantId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidPayload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
        }

        @Test
        @DisplayName("POST /api/v1/admin/merchants/{id}/suspend requires non-blank reason")
        void suspendMerchant_blankReason_returns400() throws Exception {
            UUID merchantId = UUID.randomUUID();
            String invalidPayload = """
                    {
                      "reason": "  "
                    }
                    """;

            adminMockMvc.perform(post("/api/v1/admin/merchants/{id}/suspend", merchantId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidPayload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
        }

        @Test
        @DisplayName("POST /api/v1/admin/merchants/{id}/reject with valid reason succeeds")
        void rejectMerchant_withReason_success() throws Exception {
            UUID merchantId = UUID.randomUUID();
            UUID adminId = UUID.fromString(ADMIN_USER_ID);
            MerchantApprovalActionResponse actionResponse = MerchantApprovalActionResponse.rejected(merchantId.toString(), "Invalid documents");

            when(merchantService.rejectMerchant(eq(merchantId), eq("Invalid documents"), eq(adminId)))
                    .thenReturn(actionResponse);

            String validPayload = """
                    {
                      "reason": "Invalid documents"
                    }
                    """;

            adminMockMvc.perform(post("/api/v1/admin/merchants/{id}/reject", merchantId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validPayload))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"))
                    .andExpect(jsonPath("$.data.reason").value("Invalid documents"));
        }
    }
}
