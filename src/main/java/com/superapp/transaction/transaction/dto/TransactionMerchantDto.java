package com.superapp.transaction.transaction.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(description = "Merchant reference in transaction")
public record TransactionMerchantDto(
        @Schema(description = "Merchant ID")
        UUID id,

        @Schema(description = "Merchant business name")
        String name
) {}
