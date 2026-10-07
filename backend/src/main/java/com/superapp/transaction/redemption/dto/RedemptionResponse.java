package com.superapp.transaction.redemption.dto;

import com.superapp.transaction.redemption.enums.RedemptionStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Redemption creation and details response")
public record RedemptionResponse(
        @Schema(description = "Redemption ID")
        UUID redemptionId,

        @Schema(description = "Transaction ID")
        UUID transactionId,

        @Schema(description = "Payment ID")
        UUID paymentId,

        @Schema(description = "Offer ID")
        UUID offerId,

        @Schema(description = "Store ID")
        UUID storeId,

        @Schema(description = "Redemption status")
        RedemptionStatus status,

        @Schema(description = "Total bill/redeemed amount")
        BigDecimal redeemedAmount,

        @Schema(description = "Discount amount")
        BigDecimal discountAmount,

        @Schema(description = "Reward amount credited")
        BigDecimal rewardAmount,

        @Schema(description = "Timestamp when redeemed")
        Instant redeemedAt
) {}
