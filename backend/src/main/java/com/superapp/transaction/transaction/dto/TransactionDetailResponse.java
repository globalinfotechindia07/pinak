package com.superapp.transaction.transaction.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Transaction detailed response")
public record TransactionDetailResponse(
        @Schema(description = "Transaction ID")
        UUID id,

        @Schema(description = "Transaction reference code")
        String transactionReference,

        @Schema(description = "Merchant details")
        TransactionMerchantDto merchant,

        @Schema(description = "Store details")
        TransactionStoreDto store,

        @Schema(description = "Offer details")
        TransactionOfferDto offer,

        @Schema(description = "Gross amount before discount")
        BigDecimal grossAmount,

        @Schema(description = "Discount amount")
        BigDecimal discountAmount,

        @Schema(description = "Payable amount after discount")
        BigDecimal payableAmount,

        @Schema(description = "Currency code")
        String currency,

        @Schema(description = "Payment method (e.g. UPI)")
        String paymentMethod,

        @Schema(description = "Transaction status")
        TransactionStatus status,

        @Schema(description = "Payment ID")
        UUID paymentId,

        @Schema(description = "Redemption ID if redeemed")
        UUID redemptionId,

        @Schema(description = "Provider transaction ID")
        String providerTransactionId,

        @Schema(description = "Transaction creation timestamp")
        Instant createdAt,

        @Schema(description = "Transaction update timestamp")
        Instant updatedAt
) {}
