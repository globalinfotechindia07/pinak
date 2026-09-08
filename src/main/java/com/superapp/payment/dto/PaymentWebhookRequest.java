package com.superapp.payment.dto;

import com.superapp.payment.entity.PaymentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Schema(description = "Webhook payload sent by payment gateways on payment status change")
public record PaymentWebhookRequest(
        @Schema(description = "Internal payment reference", example = "PAY_123456789")
        @NotBlank(message = "Payment reference is required")
        String paymentReference,

        @Schema(description = "External gateway transaction ID", example = "UPI_TXN_987654")
        String gatewayTransactionId,

        @Schema(description = "Payment status reported by gateway", example = "SUCCESS")
        @NotNull(message = "Status is required")
        PaymentStatus status,

        @Schema(description = "Paid amount", example = "499.00")
        BigDecimal amount,

        @Schema(description = "Failure reason if status is FAILED", example = "Bank server timeout")
        String failureReason,

        @Schema(description = "HMAC signature for webhook verification", example = "sha256=abcdef123456...")
        String signature
) {}
