package com.superapp.wallet.dto;

import com.superapp.wallet.enums.LedgerEntryType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WalletLedgerResponse(
        UUID id,
        UUID walletId,
        UUID storeId,
        String storeName,
        UUID transactionId,
        UUID payoutId,
        LedgerEntryType entryType,
        BigDecimal amount,
        BigDecimal feeDeducted,
        BigDecimal netAmount,
        BigDecimal runningBalance,
        String description,
        String sourceReference,
        Instant createdAt
) {}
