package com.superapp.transaction.reward.dto;

import com.superapp.transaction.reward.enums.RewardLedgerStatus;
import com.superapp.transaction.reward.enums.RewardLedgerType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Reward ledger entry details")
public record RewardLedgerItemResponse(
        @Schema(description = "Ledger entry ID")
        UUID id,

        @Schema(description = "Associated customer ID")
        UUID customerId,

        @Schema(description = "Customer display name or identifier")
        String customerName,

        @Schema(description = "Ledger transaction type")
        RewardLedgerType type,

        @Schema(description = "Amount")
        BigDecimal amount,

        @Schema(description = "Ledger posting status")
        RewardLedgerStatus status,

        @Schema(description = "Associated transaction ID")
        UUID transactionId,

        @Schema(description = "Associated redemption ID")
        UUID redemptionId,

        @Schema(description = "Business reference ID")
        String referenceId,

        @Schema(description = "Entry description")
        String description,

        @Schema(description = "Timestamp when entry was created")
        Instant createdAt
) {
    public RewardLedgerItemResponse(UUID id, RewardLedgerType type, BigDecimal amount, RewardLedgerStatus status,
                                    UUID transactionId, UUID redemptionId, String referenceId, String description, Instant createdAt) {
        this(id, null, null, type, amount, status, transactionId, redemptionId, referenceId, description, createdAt);
    }
}
