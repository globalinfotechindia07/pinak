package com.superapp.platform.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CashbackSettingDto(
        Boolean enabled,

        @NotNull(message = "Default cashback percentage is required")
        @DecimalMin(value = "0.0", message = "Percentage cannot be negative")
        @DecimalMax(value = "100.0", message = "Percentage cannot exceed 100%")
        BigDecimal defaultPercentage,

        @NotNull(message = "Max cashback per transaction is required")
        @DecimalMin(value = "0.0", message = "Max cashback cannot be negative")
        BigDecimal maxCashbackPerTransaction,

        @NotNull(message = "Min transaction amount is required")
        @DecimalMin(value = "0.0", message = "Min transaction amount cannot be negative")
        BigDecimal minTransactionAmount,

        String rewardMode,

        String cashbackName,

        Boolean applyToAllStores
) {
    public static CashbackSettingDto defaults() {
        return new CashbackSettingDto(
                true,
                new BigDecimal("5.00"),
                new BigDecimal("150.00"),
                new BigDecimal("100.00"),
                "COINS",
                "PINAK Instant Transaction Cashback",
                false
        );
    }
}
