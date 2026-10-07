package com.superapp.merchant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.merchant.controller.MerchantController;
import com.superapp.merchant.dto.CreateMerchantRequest;
import com.superapp.merchant.dto.MerchantResponse;
import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.merchant.dto.UpdateMerchantRequest;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.KycStatus;
import com.superapp.merchant.service.MerchantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
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

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MerchantControllerUnitTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock private MerchantService merchantService;
    @InjectMocks private MerchantController merchantController;

    private UUID merchantId;
    private UUID ownerId;
    private MerchantResponse merchantResponse;

    @BeforeEach
    void setUp() {
        merchantId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
        merchantResponse = new MerchantResponse(
                merchantId, ownerId, "ABC Retail", null, null,
                KycStatus.PENDING, ApprovalStatus.PENDING, Instant.now(), Instant.now()
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

        mockMvc = MockMvcBuilders.standaloneSetup(merchantController)
                .setCustomArgumentResolvers(authPrincipalResolver, new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/merchants creates merchant and returns 201 CREATED")
    void createMerchant_success() throws Exception {
        CreateMerchantRequest request = new CreateMerchantRequest("ABC Retail", null, null);
        when(merchantService.createMerchant(any(CreateMerchantRequest.class), eq(ownerId), eq(false)))
                .thenReturn(merchantResponse);

        mockMvc.perform(post("/api/v1/merchants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.businessName").value("ABC Retail"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /api/v1/merchants/{id} returns merchant with 200 OK")
    void getMerchantById_success() throws Exception {
        when(merchantService.getMerchantById(merchantId)).thenReturn(merchantResponse);

        mockMvc.perform(get("/api/v1/merchants/" + merchantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(merchantId.toString()));
    }

    @Test
    @DisplayName("PATCH /api/v1/merchants/{id}/status updates approval status with 200 OK")
    void updateApprovalStatus_success() throws Exception {
        UpdateApprovalStatusRequest request = new UpdateApprovalStatusRequest(ApprovalStatus.APPROVED, "Verified");
        MerchantResponse approvedResponse = new MerchantResponse(
                merchantId, ownerId, "ABC Retail", null, null,
                KycStatus.VERIFIED, ApprovalStatus.APPROVED, Instant.now(), Instant.now()
        );
        when(merchantService.updateApprovalStatus(eq(merchantId), any(UpdateApprovalStatusRequest.class)))
                .thenReturn(approvedResponse);

        mockMvc.perform(patch("/api/v1/merchants/" + merchantId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
    }
}
