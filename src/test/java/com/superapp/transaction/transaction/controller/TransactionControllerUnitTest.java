package com.superapp.transaction.transaction.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.transaction.transaction.dto.TransactionMerchantDto;
import com.superapp.transaction.transaction.dto.TransactionResponse;
import com.superapp.transaction.transaction.dto.TransactionStoreDto;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import com.superapp.transaction.transaction.service.TransactionService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TransactionControllerUnitTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock private TransactionService transactionService;
    @InjectMocks private TransactionController transactionController;

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

        mockMvc = MockMvcBuilders.standaloneSetup(transactionController)
                .setCustomArgumentResolvers(authPrincipalResolver, new org.springframework.data.web.PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/transactions — returns paginated customer transactions")
    void testGetTransactions() throws Exception {
        UUID txId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        UUID merchantId = UUID.randomUUID();
        UUID storeId = UUID.randomUUID();

        var txResponse = new TransactionResponse(
                txId, paymentId,
                new TransactionMerchantDto(merchantId, "ABC Retail"),
                new TransactionStoreDto(storeId, "ABC Store"),
                null,
                new BigDecimal("5000.00"), new BigDecimal("500.00"), new BigDecimal("4500.00"),
                "INR", TransactionStatus.SUCCESS, Instant.now()
        );

        Page<TransactionResponse> page = new PageImpl<>(List.of(txResponse));
        when(transactionService.getCustomerTransactions(eq(UUID.fromString(CUSTOMER_ID)), any(), any(), any(), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].transactionId").value(txId.toString()))
                .andExpect(jsonPath("$.data[0].payableAmount").value(4500.00))
                .andExpect(jsonPath("$.meta.page").value(0))
                .andExpect(jsonPath("$.meta.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/transactions/{transactionId} — returns transaction details")
    void testGetTransactionById() throws Exception {
        UUID txId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();

        var txResponse = new TransactionResponse(
                txId, paymentId, null, null, null,
                new BigDecimal("5000.00"), new BigDecimal("500.00"), new BigDecimal("4500.00"),
                "INR", TransactionStatus.SUCCESS, Instant.now()
        );

        when(transactionService.getTransactionById(eq(txId), eq(UUID.fromString(CUSTOMER_ID)), eq(false)))
                .thenReturn(txResponse);

        mockMvc.perform(get("/api/v1/transactions/" + txId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.transactionId").value(txId.toString()))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"));
    }
}
