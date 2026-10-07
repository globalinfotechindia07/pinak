package com.superapp.transaction.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.transaction.payment.dto.CreatePaymentRequest;
import com.superapp.transaction.payment.dto.PaymentCancelResponse;
import com.superapp.transaction.payment.dto.PaymentIntentDto;
import com.superapp.transaction.payment.dto.PaymentResponse;
import com.superapp.transaction.payment.enums.PaymentStatus;
import com.superapp.transaction.payment.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
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
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PaymentControllerUnitTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock private PaymentService paymentService;
    @InjectMocks private PaymentController paymentController;

    private static final String CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";

    @BeforeEach
    void setUp() {
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User(CUSTOMER_ID, "password", Collections.emptyList());
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(paymentController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/payments — initiates payment and returns 201 with intent")
    void testInitiatePayment() throws Exception {
        UUID storeId = UUID.randomUUID();
        UUID offerId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        UUID txId = UUID.randomUUID();

        var request = new CreatePaymentRequest(offerId, storeId, new BigDecimal("5000.00"), "INR");

        var response = new PaymentResponse(
                paymentId, txId, PaymentStatus.PENDING, "INR",
                new BigDecimal("5000.00"), new BigDecimal("500.00"), new BigDecimal("4500.00"),
                "MOCK_UPI", "ord_123", new PaymentIntentDto("UPI", "upi://pay?pa=test"),
                Instant.now().plusSeconds(900), null
        );

        when(paymentService.initiatePayment(any(), eq(UUID.fromString(CUSTOMER_ID)), eq("idemp_123"), any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/payments")
                        .header("Idempotency-Key", "idemp_123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentId").value(paymentId.toString()))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.payableAmount").value(4500.00))
                .andExpect(jsonPath("$.data.paymentIntent.type").value("UPI"));
    }

    @Test
    @DisplayName("GET /api/v1/payments/{paymentId} — fetches payment details")
    void testGetPaymentById() throws Exception {
        UUID paymentId = UUID.randomUUID();
        UUID txId = UUID.randomUUID();

        var response = new PaymentResponse(
                paymentId, txId, PaymentStatus.SUCCESS, "INR",
                new BigDecimal("5000.00"), new BigDecimal("500.00"), new BigDecimal("4500.00"),
                "MOCK_UPI", "ord_123", null, null, Instant.now()
        );

        when(paymentService.getPaymentById(eq(paymentId), eq(UUID.fromString(CUSTOMER_ID)), eq(false)))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/payments/" + paymentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentId").value(paymentId.toString()))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"));
    }

    @Test
    @DisplayName("POST /api/v1/payments/{paymentId}/cancel — cancels payment")
    void testCancelPayment() throws Exception {
        UUID paymentId = UUID.randomUUID();
        UUID txId = UUID.randomUUID();

        var response = new PaymentCancelResponse(paymentId, txId, PaymentStatus.CANCELLED, Instant.now());

        when(paymentService.cancelPayment(eq(paymentId), eq(UUID.fromString(CUSTOMER_ID)), eq(false)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/payments/" + paymentId + "/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }
}
