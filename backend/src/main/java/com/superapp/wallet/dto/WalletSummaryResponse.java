package com.superapp.wallet.dto;

import com.superapp.wallet.enums.WalletStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record WalletSummaryResponse(
        UUID id,
        UUID merchantId,
        String currency,
        BigDecimal availableBalance,
        BigDecimal pendingBalance,
        BigDecimal totalWithdrawn,
        BigDecimal lifetimeVolume,
        WalletStatus status,
        List<StoreRevenueSummaryResponse> storeBreakdown
) {}
