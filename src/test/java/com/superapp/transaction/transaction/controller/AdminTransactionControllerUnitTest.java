package com.superapp.transaction.transaction.controller;

import com.superapp.transaction.transaction.dto.TransactionDetailResponse;
import com.superapp.transaction.transaction.dto.TransactionListItemResponse;
import com.superapp.transaction.transaction.dto.TransactionMerchantDto;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminTransactionControllerUnitTest {

    private MockMvc mockMvc;

    @Mock private TransactionService transactionService;
    @InjectMocks private AdminTransactionController adminTransactionController;

    private static final String ADMIN_ID = "22222222-2222-2222-2222-222222222222";

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
                return new User(ADMIN_ID, "password", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(adminTransactionController)
                .setCustomArgumentResolvers(authPrincipalResolver, new org.springframework.data.web.PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/transactions — search & filter transactions across platform")
    void testGetAdminTransactions() throws Exception {
        UUID txId = UUID.randomUUID();
        UUID merchantId = UUID.randomUUID();
        UUID storeId = UUID.randomUUID();

        var item = new TransactionListItemResponse(
                txId, "TX-REF-ADMIN-99",
                merchantId, "Global Merchant",
                storeId, "Global Store",
                null,
                new BigDecimal("1000.00"), new BigDecimal("100.00"), new BigDecimal("900.00"),
                "INR", "UPI", TransactionStatus.SUCCESS, Instant.now()
        );

        Page<TransactionListItemResponse> page = new PageImpl<>(List.of(item));
        when(transactionService.getAdminTransactions(
                any(), any(), any(), any(), any(), any(), any(), any(), any(), eq("TX-REF"), any(), eq(UUID.fromString(ADMIN_ID)), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/transactions")
                        .param("search", "TX-REF")
                        .header("X-Request-Id", "req-12345"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(txId.toString()))
                .andExpect(jsonPath("$.data.content[0].transactionReference").value("TX-REF-ADMIN-99"))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/admin/transactions/{transactionId} — retrieve detail by admin")
    void testGetAdminTransactionById() throws Exception {
        UUID txId = UUID.randomUUID();

        var detail = new TransactionDetailResponse(
                txId, "TX-REF-ADMIN-99", null, null, null,
                new BigDecimal("1000.00"), new BigDecimal("100.00"), new BigDecimal("900.00"),
                "INR", "UPI", TransactionStatus.SUCCESS, UUID.randomUUID(), UUID.randomUUID(), "PROV-99",
                Instant.now(), Instant.now()
        );

        when(transactionService.getAdminTransactionById(eq(txId), eq(UUID.fromString(ADMIN_ID)), any()))
                .thenReturn(detail);

        mockMvc.perform(get("/api/v1/admin/transactions/" + txId)
                        .header("X-Request-Id", "req-12345"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(txId.toString()))
                .andExpect(jsonPath("$.data.transactionReference").value("TX-REF-ADMIN-99"))
                .andExpect(jsonPath("$.data.providerTransactionId").value("PROV-99"));
    }
}
