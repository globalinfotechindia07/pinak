package com.superapp.payment.dto;

import com.superapp.payment.entity.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

@Schema(description = "Request to initiate a new payment")
public record InitiatePaymentRequest(
        @Schema(description = "Payment amount", example = "499.00")
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "1.00", message = "Amount must be at least 1.00")
        BigDecimal amount,

        @Schema(description = "Currency code (default INR)", example = "INR")
        String currency,

        @Schema(description = "Merchant UUID", example = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
        @NotNull(message = "Merchant ID is required")
        UUID merchantId,

        @Schema(description = "Store/Branch UUID", example = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22")
        UUID storeId,

        @Schema(description = "Associated offer UUID (optional)", example = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33")
        UUID offerId,

        @Schema(description = "Selected payment method", example = "UPI")
        PaymentMethod paymentMethod,

        @Schema(description = "Optional notes or bill details", example = "Order #12345 at Burger Spot")
        String notes
) {}
