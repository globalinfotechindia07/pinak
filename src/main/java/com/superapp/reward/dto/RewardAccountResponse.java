package com.superapp.reward.dto;

import com.superapp.reward.entity.RewardAccountStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

@Schema(description = "Customer reward account details")
public record RewardAccountResponse(
        UUID id,
        UUID customerId,
        long pointsBalance,
        long lifetimeEarned,
        long lifetimeRedeemed,
        RewardAccountStatus status,
        Instant updatedAt
) {}
