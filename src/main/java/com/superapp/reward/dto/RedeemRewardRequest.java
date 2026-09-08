package com.superapp.reward.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

@Schema(description = "Request to redeem reward points")
public record RedeemRewardRequest(
        @Schema(description = "Customer UUID", example = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
        @NotNull(message = "Customer ID is required")
        UUID customerId,

        @Schema(description = "Points to redeem", example = "100")
        @Min(value = 1, message = "Points must be at least 1")
        long points,

        @Schema(description = "Redemption target reference type", example = "BILL_DISCOUNT")
        String referenceType,

        @Schema(description = "Redemption target reference ID", example = "PAY_123456789")
        String referenceId,

        @Schema(description = "Description or reason", example = "Redeemed 100 points for Rs 100 off bill")
        String description
) {}
