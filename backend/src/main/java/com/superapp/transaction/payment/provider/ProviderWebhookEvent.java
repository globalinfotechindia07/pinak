package com.superapp.transaction.payment.provider;

import com.superapp.transaction.payment.enums.PaymentStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record ProviderWebhookEvent(
        String eventId,
        String eventType,
        UUID paymentId,
        String providerOrderId,
        String providerPaymentId,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        String failureCode,
        String failureReason
) {}
