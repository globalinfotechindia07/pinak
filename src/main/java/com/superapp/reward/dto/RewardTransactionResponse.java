package com.superapp.reward.dto;

import com.superapp.reward.entity.RewardTransactionType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

@Schema(description = "Reward points transaction entry")
public record RewardTransactionResponse(
        UUID id,
        UUID rewardAccountId,
        long points,
        RewardTransactionType type,
        String referenceType,
        String referenceId,
        String description,
        Instant createdAt
) {}
