package com.superapp.transaction.redemption.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(description = "Offer summary in redemption response")
public record RedemptionOfferDto(
        @Schema(description = "Offer ID")
        UUID id,

        @Schema(description = "Offer title")
        String title
) {}
