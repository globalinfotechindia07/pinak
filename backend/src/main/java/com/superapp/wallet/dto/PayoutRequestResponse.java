package com.superapp.wallet.dto;

import com.superapp.wallet.enums.PayoutMode;
import com.superapp.wallet.enums.PayoutProvider;
import com.superapp.wallet.enums.PayoutStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PayoutRequestResponse(
        UUID id,
        UUID merchantId,
        String merchantName,
        UUID walletId,
        UUID bankAccountId,
        String bankName,
        String accountNumberLast4,
        String accountHolderName,
        BigDecimal amount,
        BigDecimal payoutFee,
        BigDecimal netPayout,
        String currency,
        PayoutMode mode,
        PayoutStatus status,
        PayoutProvider provider,
        String providerPayoutId,
        String bankUtr,
        UUID idempotencyKey,
        String failureReason,
        UUID requestedBy,
        Instant processedAt,
        Instant createdAt
) {}
