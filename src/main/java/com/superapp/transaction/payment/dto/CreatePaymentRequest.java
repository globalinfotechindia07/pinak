package com.superapp.transaction.payment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Schema(description = "Customer payment initiation payload")
public record CreatePaymentRequest(
        @Schema(description = "Optional offer ID to apply", example = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
        UUID offerId,

        @NotNull(message = "storeId is required")
        @Schema(description = "Store ID where payment is being made", example = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22", requiredMode = Schema.RequiredMode.REQUIRED)
        UUID storeId,

        @NotNull(message = "grossAmount is required")
        @DecimalMin(value = "0.01", message = "grossAmount must be greater than zero")
        @Schema(description = "Transaction gross amount before discounts", example = "5000.00", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal grossAmount,

        @NotBlank(message = "currency is required")
        @Schema(description = "Payment currency (INR supported for MVP)", example = "INR", requiredMode = Schema.RequiredMode.REQUIRED)
        String currency
) {}
