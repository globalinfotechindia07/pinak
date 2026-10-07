package com.superapp.transaction.reward.dto;

import com.superapp.transaction.reward.enums.RewardLedgerStatus;
import com.superapp.transaction.reward.enums.RewardLedgerType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.UUID;

@Schema(description = "Response after admin reward adjustment")
public record AdminRewardAdjustmentResponse(
        @Schema(description = "Created ledger entry ID")
        UUID ledgerEntryId,

        @Schema(description = "Target customer ID")
        UUID customerId,

        @Schema(description = "Adjustment type")
        RewardLedgerType type,

        @Schema(description = "Adjustment amount")
        BigDecimal amount,

        @Schema(description = "Posting status")
        RewardLedgerStatus status
) {}
