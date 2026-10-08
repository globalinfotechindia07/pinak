package com.superapp.wallet.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record StoreRevenueSummaryResponse(
        UUID storeId,
        String storeName,
        Long totalSalesCount,
        BigDecimal grossVolume,
        BigDecimal netEarnings,
        BigDecimal pendingClearing
) {}
