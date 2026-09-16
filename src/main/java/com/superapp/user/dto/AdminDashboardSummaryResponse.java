package com.superapp.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Admin operational dashboard summary metrics")
public record AdminDashboardSummaryResponse(
        UserMetrics users,
        MerchantMetrics merchants,
        StoreMetrics stores,
        OfferMetrics offers,
        TransactionMetrics transactions,
        Instant timestamp
) {
    public record UserMetrics(long total, long active, long inactive) {}

    public record MerchantMetrics(long total, long pendingApproval, long active, long suspended) {}

    public record StoreMetrics(long total, long pendingApproval, long active) {}

    public record OfferMetrics(long total, long pendingApproval, long active, long expired) {}

    public record TransactionMetrics(long total, long successful, long pending, long failed, long refunded) {}
}
