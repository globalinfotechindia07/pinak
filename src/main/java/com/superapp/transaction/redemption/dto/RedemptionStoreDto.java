package com.superapp.transaction.redemption.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(description = "Store summary in redemption response")
public record RedemptionStoreDto(
        @Schema(description = "Store ID")
        UUID id,

        @Schema(description = "Store name")
        String name
) {}
