package com.superapp.transaction.transaction.dto;

import java.math.BigDecimal;

public record TransactionStatsResponse(
        BigDecimal totalPlatformGmv,
        BigDecimal totalNetCollected,
        BigDecimal totalEscrowBalance,
        BigDecimal netCommissionEarned,
        BigDecimal totalDiscountSavings,
        long totalTransactions,
        long successfulTransactions,
        long pendingTransactions,
        long failedTransactions,
        long totalMerchantWallets,
        long activeStores,
        long pendingPayoutCount,
        BigDecimal pendingPayoutVolume
) {}
