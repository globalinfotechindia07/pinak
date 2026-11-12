package com.superapp.transaction.reward.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Customer reward account details for Super Admin")
public record CustomerRewardAccountResponse(
        @Schema(description = "Reward account ID")
        UUID id,

        @Schema(description = "Customer ID")
        UUID customerId,

        @Schema(description = "Customer full name or display name")
        String customerName,

        @Schema(description = "Customer phone number")
        String customerPhone,

        @Schema(description = "Customer email address")
        String customerEmail,

        @Schema(description = "Available spendable Pinak Coins balance")
        BigDecimal availableBalance,

        @Schema(description = "Pending coins balance")
        BigDecimal pendingBalance,

        @Schema(description = "Cumulative lifetime coins earned")
        BigDecimal lifetimeEarned,

        @Schema(description = "Cumulative lifetime coins redeemed")
        BigDecimal lifetimeRedeemed,

        @Schema(description = "Currency designation (INR/COINS)")
        String currency,

        @Schema(description = "Loyalty tier (BRONZE, SILVER, GOLD, PLATINUM)")
        String tier,

        @Schema(description = "Account status")
        String status,

        @Schema(description = "Creation timestamp")
        Instant createdAt,

        @Schema(description = "Last update timestamp")
        Instant updatedAt
) {}
