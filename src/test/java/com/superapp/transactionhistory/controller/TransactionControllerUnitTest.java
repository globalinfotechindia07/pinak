package com.superapp.transactionhistory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.transactionhistory.dto.TransactionResponse;
import com.superapp.transactionhistory.entity.TransactionStatus;
import com.superapp.transactionhistory.entity.TransactionType;
import com.superapp.transactionhistory.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
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

    @Mock TransactionService transactionService;
    @InjectMocks TransactionController transactionController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(transactionController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/transactions/{id} — returns transaction response")
    void getById_success() throws Exception {
        UUID txId = UUID.randomUUID();
        var response = new TransactionResponse(
                txId, "TXN_12345", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                null, new BigDecimal("100.00"), "INR", TransactionType.PAYMENT,
                TransactionStatus.SUCCESS, "Order payment", Instant.now()
        );

        when(transactionService.getTransactionById(eq(txId))).thenReturn(response);

        mockMvc.perform(get("/api/v1/transactions/" + txId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.transactionReference").value("TXN_12345"))
                .andExpect(jsonPath("$.data.amount").value(100.00));
    }

    @Test
    @DisplayName("GET /api/v1/transactions/customer/{customerId} — returns paginated list")
    void getCustomerTransactions_success() throws Exception {
        UUID customerId = UUID.randomUUID();
        var response = new TransactionResponse(
                UUID.randomUUID(), "TXN_CUST_1", UUID.randomUUID(), customerId, UUID.randomUUID(),
                null, new BigDecimal("100.00"), "INR", TransactionType.PAYMENT,
                TransactionStatus.SUCCESS, "Customer payment", Instant.now()
        );

        when(transactionService.getCustomerTransactions(eq(customerId), any()))
                .thenReturn(new PageImpl<>(List.of(response), org.springframework.data.domain.PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/v1/transactions/customer/" + customerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].transactionReference").value("TXN_CUST_1"));
    }
}
