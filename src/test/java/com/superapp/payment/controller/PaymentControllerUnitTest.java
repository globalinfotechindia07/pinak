package com.superapp.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.payment.dto.InitiatePaymentRequest;
import com.superapp.payment.dto.PaymentResponse;
import com.superapp.payment.dto.PaymentWebhookRequest;
import com.superapp.payment.dto.RefundPaymentRequest;
import com.superapp.payment.entity.PaymentMethod;
import com.superapp.payment.entity.PaymentStatus;
import com.superapp.payment.service.PaymentService;
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

    @Mock PaymentService paymentService;
    @InjectMocks PaymentController paymentController;

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
    @DisplayName("POST /api/v1/payments/initiate — initiates payment and returns 201 with UPI intent")
    void initiatePayment_success() throws Exception {
        UUID customerId = UUID.fromString(CUSTOMER_ID);
        UUID merchantId = UUID.randomUUID();
        var request = new InitiatePaymentRequest(
                new BigDecimal("499.00"), "INR", merchantId, null, null, PaymentMethod.UPI, "Dinner"
        );

        var paymentResponse = new PaymentResponse(
                UUID.randomUUID(), "PAY_TEST_REF", "UPI_ORD_1", customerId, merchantId,
                null, null, new BigDecimal("499.00"), "INR", PaymentMethod.UPI,
                PaymentStatus.PENDING, null, "upi://pay?...", "qr_code", "Dinner",
                Instant.now(), Instant.now()
        );

        when(paymentService.initiatePayment(any(), eq(customerId))).thenReturn(paymentResponse);

        mockMvc.perform(post("/api/v1/payments/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentReference").value("PAY_TEST_REF"))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.upiIntentUrl").value("upi://pay?..."));
    }

    @Test
    @DisplayName("GET /api/v1/payments/{id} — returns payment details")
    void getPaymentById_success() throws Exception {
        UUID paymentId = UUID.randomUUID();
        var paymentResponse = new PaymentResponse(
                paymentId, "PAY_TEST_REF", "UPI_ORD_1", UUID.randomUUID(), UUID.randomUUID(),
                null, null, new BigDecimal("499.00"), "INR", PaymentMethod.UPI,
                PaymentStatus.SUCCESS, null, null, null, null,
                Instant.now(), Instant.now()
        );

        when(paymentService.getPaymentById(eq(paymentId))).thenReturn(paymentResponse);

        mockMvc.perform(get("/api/v1/payments/" + paymentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(paymentId.toString()))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"));
    }

    @Test
    @DisplayName("POST /api/v1/payments/webhook — processes payment webhook successfully")
    void handleWebhook_success() throws Exception {
        var webhook = new PaymentWebhookRequest(
                "PAY_TEST_REF", "GATEWAY_TXN_001", PaymentStatus.SUCCESS,
                new BigDecimal("499.00"), null, "sig_valid"
        );

        var paymentResponse = new PaymentResponse(
                UUID.randomUUID(), "PAY_TEST_REF", "GATEWAY_TXN_001", UUID.randomUUID(), UUID.randomUUID(),
                null, null, new BigDecimal("499.00"), "INR", PaymentMethod.UPI,
                PaymentStatus.SUCCESS, null, null, null, null,
                Instant.now(), Instant.now()
        );

        when(paymentService.processWebhook(any())).thenReturn(paymentResponse);

        mockMvc.perform(post("/api/v1/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(webhook)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"));
    }

    @Test
    @DisplayName("POST /api/v1/payments/{id}/refund — processes refund successfully")
    void refundPayment_success() throws Exception {
        UUID paymentId = UUID.randomUUID();
        var refundRequest = new RefundPaymentRequest(new BigDecimal("499.00"), "Product defective");

        var paymentResponse = new PaymentResponse(
                paymentId, "PAY_TEST_REF", "GATEWAY_TXN_001", UUID.randomUUID(), UUID.randomUUID(),
                null, null, new BigDecimal("499.00"), "INR", PaymentMethod.UPI,
                PaymentStatus.REFUNDED, null, null, null, null,
                Instant.now(), Instant.now()
        );

        when(paymentService.refundPayment(eq(paymentId), any())).thenReturn(paymentResponse);

        mockMvc.perform(post("/api/v1/payments/" + paymentId + "/refund")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refundRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("REFUNDED"));
    }
}
