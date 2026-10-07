package com.superapp.transaction.transaction.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Offer reference in transaction")
public record TransactionOfferDto(
        @Schema(description = "Offer ID")
        UUID id,

        @Schema(description = "Offer title")
        String title
) {}
