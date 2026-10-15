package com.superapp.interaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record RecordRecentlyViewedRequest(
        @NotBlank(message = "itemType is required (PRODUCT or MERCHANT)")
        String itemType,

        @NotNull(message = "itemId is required")
        UUID itemId,

        UUID branchId
) {}
