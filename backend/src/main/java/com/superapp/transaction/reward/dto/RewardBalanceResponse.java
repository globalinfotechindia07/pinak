package com.superapp.transaction.reward.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Customer reward balance summary")
public record RewardBalanceResponse(
        @Schema(description = "Available spendable balance", example = "250.00")
        BigDecimal availableBalance,

        @Schema(description = "Pending balance awaiting settlement", example = "50.00")
        BigDecimal pendingBalance,

        @Schema(description = "Total lifetime rewards earned", example = "850.00")
        BigDecimal lifetimeEarned,

        @Schema(description = "Total lifetime rewards redeemed", example = "600.00")
        BigDecimal lifetimeRedeemed,

        @Schema(description = "Currency code", example = "INR")
        String currency
) {}
