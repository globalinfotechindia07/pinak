package com.superapp.wallet.dto;

import java.math.BigDecimal;

public record PlatformSettlementOverviewResponse(
        BigDecimal totalPlatformGmv,
        BigDecimal totalEscrowBalance,
        BigDecimal netCommissionEarned,
        Long totalMerchantWallets,
        Long pendingPayoutCount,
        BigDecimal pendingPayoutVolume,
        Long failedPayoutCount
) {}
