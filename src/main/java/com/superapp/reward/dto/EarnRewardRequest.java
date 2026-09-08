package com.superapp.reward.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

@Schema(description = "Request to credit reward points to a customer")
public record EarnRewardRequest(
        @Schema(description = "Customer UUID", example = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
        @NotNull(message = "Customer ID is required")
        UUID customerId,

        @Schema(description = "Points to credit", example = "50")
        @Min(value = 1, message = "Points must be at least 1")
        long points,

        @Schema(description = "Source reference type (e.g. PAYMENT, OFFER_REDEMPTION)", example = "PAYMENT")
        String referenceType,

        @Schema(description = "Source reference identifier", example = "PAY_123456789")
        String referenceId,

        @Schema(description = "Description or reason", example = "5% cashback points for order PAY_123456789")
        String description
) {}
