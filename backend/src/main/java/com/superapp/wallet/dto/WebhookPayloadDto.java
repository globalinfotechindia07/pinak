package com.superapp.wallet.dto;

public record WebhookPayloadDto(
        String event,
        String providerPayoutId,
        String status,
        String utr,
        String failureReason,
        Long timestamp,
        String signature
) {}
