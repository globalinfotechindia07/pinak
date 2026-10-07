package com.superapp.transaction.reward;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.transaction.reward.controller.AdminRewardController;
import com.superapp.transaction.reward.controller.RewardController;
import com.superapp.transaction.reward.dto.*;
import com.superapp.transaction.reward.enums.RewardLedgerStatus;
import com.superapp.transaction.reward.enums.RewardLedgerType;
import com.superapp.transaction.reward.service.RewardService;
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
class RewardControllerUnitTest {

    private MockMvc customerMockMvc;
    private MockMvc adminMockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock private RewardService rewardService;

    @InjectMocks private RewardController rewardController;
    @InjectMocks private AdminRewardController adminRewardController;

    private static final String CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";
    private static final String ADMIN_ID = "99999999-9999-9999-9999-999999999999";

    @BeforeEach
    void setUp() {
        customerMockMvc = MockMvcBuilders.standaloneSetup(rewardController)
                .setCustomArgumentResolvers(
                        createAuthPrincipalResolver(CUSTOMER_ID, "ROLE_CUSTOMER"),
                        new PageableHandlerMethodArgumentResolver())
                .build();

        adminMockMvc = MockMvcBuilders.standaloneSetup(adminRewardController)
                .setCustomArgumentResolvers(
                        createAuthPrincipalResolver(ADMIN_ID, "ROLE_ADMIN"),
                        new PageableHandlerMethodArgumentResolver())
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
    @DisplayName("GET /api/v1/rewards - Fetch customer reward balance")
    void testGetRewardBalance() throws Exception {
        RewardBalanceResponse balance = new RewardBalanceResponse(
                BigDecimal.valueOf(250.00),
                BigDecimal.valueOf(50.00),
                BigDecimal.valueOf(850.00),
                BigDecimal.valueOf(600.00),
                "INR"
        );

        when(rewardService.getRewardBalance(UUID.fromString(CUSTOMER_ID))).thenReturn(balance);

        customerMockMvc.perform(get("/api/v1/rewards"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.availableBalance").value(250.00))
                .andExpect(jsonPath("$.data.pendingBalance").value(50.00))
                .andExpect(jsonPath("$.data.lifetimeEarned").value(850.00))
                .andExpect(jsonPath("$.data.currency").value("INR"));
    }

    @Test
    @DisplayName("GET /api/v1/rewards/ledger - Fetch customer reward ledger")
    void testGetCustomerLedger() throws Exception {
        RewardLedgerItemResponse item = new RewardLedgerItemResponse(
                UUID.randomUUID(),
                RewardLedgerType.CREDIT,
                BigDecimal.valueOf(50.00),
                RewardLedgerStatus.POSTED,
                UUID.randomUUID(),
                UUID.randomUUID(),
                "REWARD-123",
                "Reward credited",
                Instant.now()
        );

        when(rewardService.getCustomerLedger(eq(UUID.fromString(CUSTOMER_ID)), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(item)));

        customerMockMvc.perform(get("/api/v1/rewards/ledger?page=0&size=20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].amount").value(50.00))
                .andExpect(jsonPath("$.data[0].type").value("CREDIT"));
    }

    @Test
    @DisplayName("GET /api/v1/rewards/ledger/{id} - Fetch individual ledger entry")
    void testGetLedgerEntryById() throws Exception {
        UUID entryId = UUID.randomUUID();
        RewardLedgerItemResponse item = new RewardLedgerItemResponse(
                entryId,
                RewardLedgerType.CREDIT,
                BigDecimal.valueOf(75.00),
                RewardLedgerStatus.POSTED,
                null, null,
                "REF-75",
                "Bonus",
                Instant.now()
        );

        when(rewardService.getLedgerEntryById(eq(entryId), eq(UUID.fromString(CUSTOMER_ID)), eq(false)))
                .thenReturn(item);

        customerMockMvc.perform(get("/api/v1/rewards/ledger/{entryId}", entryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(entryId.toString()))
                .andExpect(jsonPath("$.data.amount").value(75.00));
    }

    @Test
    @DisplayName("POST /api/v1/admin/rewards/adjustments - Process admin adjustment")
    void testAdminAdjustReward() throws Exception {
        AdminRewardAdjustmentRequest request = new AdminRewardAdjustmentRequest(
                UUID.fromString(CUSTOMER_ID),
                BigDecimal.valueOf(100.00),
                RewardLedgerType.CREDIT,
                "Customer compensation"
        );

        AdminRewardAdjustmentResponse response = new AdminRewardAdjustmentResponse(
                UUID.randomUUID(),
                UUID.fromString(CUSTOMER_ID),
                RewardLedgerType.CREDIT,
                BigDecimal.valueOf(100.00),
                RewardLedgerStatus.POSTED
        );

        when(rewardService.adjustReward(any(), eq("idemp-key-adj"), any(), eq(UUID.fromString(ADMIN_ID))))
                .thenReturn(response);

        adminMockMvc.perform(post("/api/v1/admin/rewards/adjustments")
                        .header("Idempotency-Key", "idemp-key-adj")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.amount").value(100.00))
                .andExpect(jsonPath("$.data.type").value("CREDIT"));
    }

    @Test
    @DisplayName("POST /api/v1/admin/rewards/reversals - Process reward reversal")
    void testAdminReverseReward() throws Exception {
        UUID entryId = UUID.randomUUID();
        RewardReversalRequest request = new RewardReversalRequest(entryId, "Transaction refunded");

        RewardLedgerItemResponse response = new RewardLedgerItemResponse(
                UUID.randomUUID(),
                RewardLedgerType.REVERSAL,
                BigDecimal.valueOf(50.00),
                RewardLedgerStatus.POSTED,
                null, null,
                "REVERSAL-" + entryId,
                "Reversal: Transaction refunded",
                Instant.now()
        );

        when(rewardService.reverseReward(eq(entryId), eq("Transaction refunded"), any(), eq(UUID.fromString(ADMIN_ID))))
                .thenReturn(response);

        adminMockMvc.perform(post("/api/v1/admin/rewards/reversals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.type").value("REVERSAL"))
                .andExpect(jsonPath("$.data.amount").value(50.00));
    }
}
