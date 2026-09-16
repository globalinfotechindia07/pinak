package com.superapp.transaction.redemption;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.transaction.redemption.controller.AdminRedemptionController;
import com.superapp.transaction.redemption.controller.MerchantRedemptionController;
import com.superapp.transaction.redemption.controller.RedemptionController;
import com.superapp.transaction.redemption.dto.CreateRedemptionRequest;
import com.superapp.transaction.redemption.dto.RedemptionHistoryResponse;
import com.superapp.transaction.redemption.dto.RedemptionOfferDto;
import com.superapp.transaction.redemption.dto.RedemptionResponse;
import com.superapp.transaction.redemption.dto.RedemptionStoreDto;
import com.superapp.transaction.redemption.enums.RedemptionStatus;
import com.superapp.transaction.redemption.service.RedemptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Page;
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
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RedemptionControllerUnitTest {

    private MockMvc customerMockMvc;
    private MockMvc merchantMockMvc;
    private MockMvc adminMockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock private RedemptionService redemptionService;

    @InjectMocks private RedemptionController redemptionController;
    @InjectMocks private MerchantRedemptionController merchantRedemptionController;
    @InjectMocks private AdminRedemptionController adminRedemptionController;

    private static final String CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";
    private static final String MERCHANT_USER_ID = "22222222-2222-2222-2222-222222222222";
    private static final String ADMIN_USER_ID = "33333333-3333-3333-3333-333333333333";

    @BeforeEach
    void setUp() {
        customerMockMvc = MockMvcBuilders.standaloneSetup(redemptionController)
                .setCustomArgumentResolvers(createAuthPrincipalResolver(CUSTOMER_ID, "ROLE_CUSTOMER"),
                        new org.springframework.data.web.PageableHandlerMethodArgumentResolver())
                .build();

        merchantMockMvc = MockMvcBuilders.standaloneSetup(merchantRedemptionController)
                .setCustomArgumentResolvers(createAuthPrincipalResolver(MERCHANT_USER_ID, "ROLE_MERCHANT"),
                        new org.springframework.data.web.PageableHandlerMethodArgumentResolver())
                .build();

        adminMockMvc = MockMvcBuilders.standaloneSetup(adminRedemptionController)
                .setCustomArgumentResolvers(createAuthPrincipalResolver(ADMIN_USER_ID, "ROLE_ADMIN"),
                        new org.springframework.data.web.PageableHandlerMethodArgumentResolver())
                .build();
    }

    private HandlerMethodArgumentResolver createAuthPrincipalResolver(String userId, String role) {
        return new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User(userId, "N/A", List.of(new SimpleGrantedAuthority(role)));
            }
        };
    }

    @Test
    @DisplayName("POST /api/v1/redemptions - Successfully redeem offer with 201 Created")
    void testRedeemOffer_Success() throws Exception {
        UUID paymentId = UUID.randomUUID();
        UUID offerId = UUID.randomUUID();
        CreateRedemptionRequest request = new CreateRedemptionRequest(paymentId, offerId);

        RedemptionResponse response = new RedemptionResponse(
                UUID.randomUUID(),
                UUID.randomUUID(),
                paymentId,
                offerId,
                UUID.randomUUID(),
                RedemptionStatus.SUCCESS,
                BigDecimal.valueOf(1000),
                BigDecimal.valueOf(100),
                BigDecimal.ZERO,
                Instant.now()
        );

        when(redemptionService.redeemOffer(eq(UUID.fromString(CUSTOMER_ID)), any(), eq("idemp-key-1"), any()))
                .thenReturn(response);

        customerMockMvc.perform(post("/api/v1/redemptions")
                        .header("Idempotency-Key", "idemp-key-1")
                        .header("X-Request-Id", "req-test-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Offer redeemed successfully"))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.paymentId").value(paymentId.toString()))
                .andExpect(jsonPath("$.data.offerId").value(offerId.toString()));
    }

    @Test
    @DisplayName("GET /api/v1/redemptions - Retrieve customer redemption history")
    void testGetCustomerRedemptions_Success() throws Exception {
        RedemptionHistoryResponse historyItem = new RedemptionHistoryResponse(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                new RedemptionOfferDto(UUID.randomUUID(), "Summer Sale"),
                new RedemptionStoreDto(UUID.randomUUID(), "Dharampeth Branch"),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(50),
                BigDecimal.ZERO,
                RedemptionStatus.SUCCESS,
                Instant.now()
        );
        Page<RedemptionHistoryResponse> page = new PageImpl<>(List.of(historyItem));

        when(redemptionService.getCustomerRedemptions(eq(UUID.fromString(CUSTOMER_ID)), any(), any(), any(), any()))
                .thenReturn(page);

        customerMockMvc.perform(get("/api/v1/redemptions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].status").value("SUCCESS"))
                .andExpect(jsonPath("$.data[0].offer.title").value("Summer Sale"))
                .andExpect(jsonPath("$.data[0].store.name").value("Dharampeth Branch"));
    }

    @Test
    @DisplayName("GET /api/v1/redemptions/{id} - Get redemption details by ID")
    void testGetRedemptionById_Success() throws Exception {
        UUID redemptionId = UUID.randomUUID();
        RedemptionResponse response = new RedemptionResponse(
                redemptionId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                RedemptionStatus.SUCCESS,
                BigDecimal.valueOf(1500),
                BigDecimal.valueOf(150),
                BigDecimal.ZERO,
                Instant.now()
        );

        when(redemptionService.getRedemptionById(eq(redemptionId), eq(UUID.fromString(CUSTOMER_ID)), eq(false)))
                .thenReturn(response);

        customerMockMvc.perform(get("/api/v1/redemptions/{id}", redemptionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.redemptionId").value(redemptionId.toString()));
    }

    @Test
    @DisplayName("GET /api/v1/merchant/redemptions - Retrieve merchant store redemptions")
    void testGetMerchantRedemptions_Success() throws Exception {
        Page<RedemptionHistoryResponse> emptyPage = new PageImpl<>(Collections.emptyList());

        when(redemptionService.getMerchantRedemptions(eq(UUID.fromString(MERCHANT_USER_ID)), any(), any(), any(), any(), any(), any()))
                .thenReturn(emptyPage);

        merchantMockMvc.perform(get("/api/v1/merchant/redemptions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Merchant redemptions fetched successfully"));
    }

    @Test
    @DisplayName("GET /api/v1/admin/redemptions - Retrieve administrative redemptions")
    void testGetAdminRedemptions_Success() throws Exception {
        Page<RedemptionHistoryResponse> emptyPage = new PageImpl<>(Collections.emptyList());

        when(redemptionService.getAdminRedemptions(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(emptyPage);

        adminMockMvc.perform(get("/api/v1/admin/redemptions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Admin redemptions fetched successfully"));
    }
}
