package com.superapp.transactionhistory.dto;

import com.superapp.transactionhistory.entity.TransactionStatus;
import com.superapp.transactionhistory.entity.TransactionType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Transaction record response")
public record TransactionResponse(
        UUID id,
        String transactionReference,
        UUID paymentId,
        UUID customerId,
        UUID merchantId,
        UUID storeId,
        BigDecimal amount,
        String currency,
        TransactionType type,
        TransactionStatus status,
        String description,
        Instant createdAt
) {}
