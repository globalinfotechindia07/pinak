package com.superapp.transaction.payment.dto;

import com.superapp.transaction.payment.enums.PaymentStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

@Schema(description = "Payment cancellation response")
public record PaymentCancelResponse(
        @Schema(description = "Payment unique ID")
        UUID paymentId,

        @Schema(description = "Internal business transaction ID")
        UUID transactionId,

        @Schema(description = "Payment status")
        PaymentStatus status,

        @Schema(description = "Timestamp when payment was cancelled")
        Instant cancelledAt
) {}
