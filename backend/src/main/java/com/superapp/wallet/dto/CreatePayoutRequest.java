package com.superapp.wallet.dto;

import com.superapp.wallet.enums.PayoutMode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreatePayoutRequest(
        @NotNull(message = "Payout amount is required")
        @DecimalMin(value = "10.00", message = "Minimum payout amount is ₹10")
        BigDecimal amount,

        @NotNull(message = "Bank account ID is required")
        UUID bankAccountId,

        PayoutMode mode,

        String otpCode,

        @NotNull(message = "Idempotency Key is required")
        UUID idempotencyKey
) {}
