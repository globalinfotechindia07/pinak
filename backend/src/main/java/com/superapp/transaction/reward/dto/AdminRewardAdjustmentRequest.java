package com.superapp.transaction.reward.dto;

import com.superapp.transaction.reward.enums.RewardLedgerType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

@Schema(description = "Admin request to adjust a customer's reward balance")
public record AdminRewardAdjustmentRequest(
        @NotNull(message = "Customer ID is required")
        @Schema(description = "UUID of the customer")
        UUID customerId,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @Schema(description = "Adjustment amount", example = "100.00")
        BigDecimal amount,

        @NotNull(message = "Type is required")
        @Schema(description = "Adjustment type (CREDIT, DEBIT, ADJUSTMENT)", example = "CREDIT")
        RewardLedgerType type,

        @NotBlank(message = "Reason is mandatory for admin adjustments")
        @Schema(description = "Business reason for adjustment", example = "Customer service compensation")
        String reason
) {}
