package com.superapp.transaction.redemption.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

@Schema(description = "Request to redeem an eligible offer after verified payment")
public record CreateRedemptionRequest(
        @NotNull(message = "Payment ID is required")
        @Schema(description = "UUID of the successful payment", example = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
        UUID paymentId,

        @NotNull(message = "Offer ID is required")
        @Schema(description = "UUID of the offer to redeem", example = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22")
        UUID offerId
) {}
