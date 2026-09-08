package com.superapp.reward.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.reward.dto.EarnRewardRequest;
import com.superapp.reward.dto.RedeemRewardRequest;
import com.superapp.reward.dto.RewardAccountResponse;
import com.superapp.reward.dto.RewardTransactionResponse;
import com.superapp.reward.entity.RewardAccountStatus;
import com.superapp.reward.entity.RewardTransactionType;
import com.superapp.reward.service.RewardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
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

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock RewardService rewardService;
    @InjectMocks RewardController rewardController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(rewardController).build();
    }

    @Test
    @DisplayName("GET /api/v1/rewards/account/{customerId} — returns reward balance")
    void getAccount_success() throws Exception {
        UUID customerId = UUID.randomUUID();
        var response = new RewardAccountResponse(
                UUID.randomUUID(), customerId, 250L, 500L, 250L,
                RewardAccountStatus.ACTIVE, Instant.now()
        );

        when(rewardService.getAccountResponse(eq(customerId))).thenReturn(response);

        mockMvc.perform(get("/api/v1/rewards/account/" + customerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.pointsBalance").value(250))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("POST /api/v1/rewards/earn — credits points to customer")
    void earnPoints_success() throws Exception {
        UUID customerId = UUID.randomUUID();
        var request = new EarnRewardRequest(customerId, 50L, "PAYMENT", "PAY_1", "Cashback");
        var response = new RewardTransactionResponse(
                UUID.randomUUID(), UUID.randomUUID(), 50L, RewardTransactionType.EARNED,
                "PAYMENT", "PAY_1", "Cashback", Instant.now()
        );

        when(rewardService.earnPoints(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/rewards/earn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.points").value(50))
                .andExpect(jsonPath("$.data.type").value("EARNED"));
    }

    @Test
    @DisplayName("POST /api/v1/rewards/redeem — redeems customer points")
    void redeemPoints_success() throws Exception {
        UUID customerId = UUID.randomUUID();
        var request = new RedeemRewardRequest(customerId, 20L, "ORDER_DISCOUNT", "PAY_1", "Discount");
        var response = new RewardTransactionResponse(
                UUID.randomUUID(), UUID.randomUUID(), 20L, RewardTransactionType.REDEEMED,
                "ORDER_DISCOUNT", "PAY_1", "Discount", Instant.now()
        );

        when(rewardService.redeemPoints(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/rewards/redeem")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.points").value(20))
                .andExpect(jsonPath("$.data.type").value("REDEEMED"));
    }
}
