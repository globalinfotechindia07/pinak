package com.superapp.payment.dto;

import com.superapp.payment.entity.PaymentMethod;
import com.superapp.payment.entity.PaymentStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Payment details response")
public record PaymentResponse(
        UUID id,
        String paymentReference,
        String gatewayTransactionId,
        UUID customerId,
        UUID merchantId,
        UUID storeId,
        UUID offerId,
        BigDecimal amount,
        String currency,
        PaymentMethod paymentMethod,
        PaymentStatus status,
        String failureReason,
        String upiIntentUrl,
        String qrCodeData,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {}
