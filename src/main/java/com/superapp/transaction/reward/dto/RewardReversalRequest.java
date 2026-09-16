package com.superapp.transaction.reward.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

@Schema(description = "Admin request to reverse a previously posted reward entry")
public record RewardReversalRequest(
        @NotNull(message = "Ledger entry ID is required")
        @Schema(description = "UUID of the original ledger entry to reverse")
        UUID ledgerEntryId,

        @NotBlank(message = "Reason is mandatory for reward reversal")
        @Schema(description = "Business reason for reversal", example = "Order cancelled and refunded")
        String reason
) {}
