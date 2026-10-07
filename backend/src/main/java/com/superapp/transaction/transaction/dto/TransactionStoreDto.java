package com.superapp.transaction.transaction.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(description = "Store reference in transaction")
public record TransactionStoreDto(
        @Schema(description = "Store ID")
        UUID id,

        @Schema(description = "Store name")
        String name
) {}
