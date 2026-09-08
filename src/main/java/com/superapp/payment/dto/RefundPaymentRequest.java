package com.superapp.payment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Schema(description = "Request to refund an existing payment")
public record RefundPaymentRequest(
        @Schema(description = "Refund amount", example = "499.00")
        @NotNull(message = "Refund amount is required")
        @DecimalMin(value = "1.00", message = "Amount must be at least 1.00")
        BigDecimal amount,

        @Schema(description = "Reason for the refund", example = "Merchant cancelled order")
        @NotBlank(message = "Refund reason is required")
        String reason
) {}
