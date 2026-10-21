package com.superapp.transaction.reward.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Schema(description = "Customer reward balance summary")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RewardBalanceResponse(
        @Schema(description = "Available spendable balance in rupees", example = "48.00")
        BigDecimal availableBalance,

        @Schema(description = "Pending balance awaiting settlement in rupees", example = "4.80")
        BigDecimal pendingBalance,

        @Schema(description = "Total lifetime rewards earned", example = "850.00")
        BigDecimal lifetimeEarned,

        @Schema(description = "Total lifetime rewards redeemed", example = "600.00")
        BigDecimal lifetimeRedeemed,

        @Schema(description = "Currency code or token name", example = "PINAK_COIN")
        String currency,

        @Schema(description = "Available spendable coins", example = "480")
        Long availableCoins,

        @Schema(description = "Pending coins awaiting settlement", example = "48")
        Long pendingCoins,

        @Schema(description = "Human-readable coin display value", example = "480 Coins")
        String displayValue,

        @Schema(description = "Rupee equivalent display value", example = "₹48")
        String rupeeValue
) {
    public RewardBalanceResponse(BigDecimal availableBalance, BigDecimal pendingBalance,
                                 BigDecimal lifetimeEarned, BigDecimal lifetimeRedeemed,
                                 String currency) {
        this(
                availableBalance != null ? availableBalance : BigDecimal.ZERO,
                pendingBalance != null ? pendingBalance : BigDecimal.ZERO,
                lifetimeEarned != null ? lifetimeEarned : BigDecimal.ZERO,
                lifetimeRedeemed != null ? lifetimeRedeemed : BigDecimal.ZERO,
                currency != null ? currency : "PINAK_COIN",
                availableBalance != null ? availableBalance.multiply(BigDecimal.valueOf(10)).longValue() : 0L,
                pendingBalance != null ? pendingBalance.multiply(BigDecimal.valueOf(10)).longValue() : 0L,
                (availableBalance != null ? availableBalance.multiply(BigDecimal.valueOf(10)).longValue() : 0L) + " Coins",
                "₹" + (availableBalance != null ? availableBalance.setScale(0, RoundingMode.DOWN).toPlainString() : "0")
        );
    }
}

