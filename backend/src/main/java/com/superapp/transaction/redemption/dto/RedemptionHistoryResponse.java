package com.superapp.transaction.redemption.dto;

import com.superapp.transaction.redemption.enums.RedemptionStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Redemption history item with offer and store details")
public record RedemptionHistoryResponse(
        @Schema(description = "Redemption ID")
        UUID redemptionId,

        @Schema(description = "Transaction ID")
        UUID transactionId,

        @Schema(description = "Payment ID")
        UUID paymentId,

        @Schema(description = "Offer summary")
        RedemptionOfferDto offer,

        @Schema(description = "Store summary")
        RedemptionStoreDto store,

        @Schema(description = "Total bill/redeemed amount")
        BigDecimal redeemedAmount,

        @Schema(description = "Discount amount")
        BigDecimal discountAmount,

        @Schema(description = "Reward amount")
        BigDecimal rewardAmount,

        @Schema(description = "Redemption status")
        RedemptionStatus status,

        @Schema(description = "Timestamp when redeemed")
        Instant redeemedAt
) {}
