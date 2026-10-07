package com.superapp.transaction.transaction.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Transaction list item response")
public record TransactionListItemResponse(
        @Schema(description = "Transaction ID")
        UUID id,

        @Schema(description = "Transaction reference code")
        String transactionReference,

        @Schema(description = "Merchant ID")
        UUID merchantId,

        @Schema(description = "Merchant business name")
        String merchantName,

        @Schema(description = "Store ID")
        UUID storeId,

        @Schema(description = "Store branch name")
        String storeName,

        @Schema(description = "Offer ID")
        UUID offerId,

        @Schema(description = "Gross amount before discount")
        BigDecimal grossAmount,

        @Schema(description = "Discount amount")
        BigDecimal discountAmount,

        @Schema(description = "Payable amount after discount")
        BigDecimal payableAmount,

        @Schema(description = "Currency code (e.g. INR)")
        String currency,

        @Schema(description = "Payment method (e.g. UPI)")
        String paymentMethod,

        @Schema(description = "Transaction status")
        TransactionStatus status,

        @Schema(description = "Transaction creation timestamp")
        Instant createdAt
) {}
