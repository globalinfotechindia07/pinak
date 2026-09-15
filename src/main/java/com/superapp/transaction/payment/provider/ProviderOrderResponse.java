package com.superapp.transaction.payment.provider;

import com.superapp.transaction.payment.enums.PaymentIntentType;

import java.time.Instant;

public record ProviderOrderResponse(
        String provider,
        String providerOrderId,
        PaymentIntentType intentType,
        String intentValue,
        Instant expiresAt
) {}
