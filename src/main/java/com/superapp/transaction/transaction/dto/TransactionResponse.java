package com.superapp.transaction.transaction.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Transaction response details")
public record TransactionResponse(
        @Schema(description = "Internal transaction ID")
        UUID transactionId,

        @Schema(description = "Associated payment ID")
        UUID paymentId,

        @Schema(description = "Merchant details")
        TransactionMerchantDto merchant,

        @Schema(description = "Store details")
        TransactionStoreDto store,

        @Schema(description = "Offer details if offer applied")
        TransactionOfferDto offer,

        @Schema(description = "Gross amount")
        BigDecimal grossAmount,

        @Schema(description = "Discount amount")
        BigDecimal discountAmount,

        @Schema(description = "Payable amount")
        BigDecimal payableAmount,

        @Schema(description = "Currency")
        String currency,

        @Schema(description = "Transaction status")
        TransactionStatus status,

        @Schema(description = "Transaction creation timestamp")
        Instant createdAt
) {}
