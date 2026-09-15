package com.superapp.transaction.payment.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.transaction.payment.enums.PaymentStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Payment response data")
public record PaymentResponse(
        @Schema(description = "Payment unique ID")
        UUID paymentId,

        @Schema(description = "Internal business transaction ID")
        UUID transactionId,

        @Schema(description = "Payment status")
        PaymentStatus status,

        @Schema(description = "Currency")
        String currency,

        @Schema(description = "Gross amount before discount")
        BigDecimal grossAmount,

        @Schema(description = "Discount / Cashback amount calculated by backend")
        BigDecimal discountAmount,

        @Schema(description = "Final payable amount calculated by backend")
        BigDecimal payableAmount,

        @Schema(description = "Payment provider name")
        String provider,

        @Schema(description = "Payment provider order ID")
        String providerOrderId,

        @Schema(description = "Provider payment intent object")
        PaymentIntentDto paymentIntent,

        @Schema(description = "Payment expiration timestamp")
        Instant expiresAt,

        @Schema(description = "Payment completion timestamp")
        Instant paidAt
) {}
