package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MerchantOfferResponse(
        String id,
        String storeId,
        String storeName,
        String merchantId,
        String categoryId,
        String title,
        String description,
        String offerType,
        BigDecimal value,
        BigDecimal minTransactionAmount,
        BigDecimal maxDiscountAmount,
        Integer usageLimit,
        Integer perCustomerLimit,
        Instant validFrom,
        Instant validTo,
        String status,
        String approvalStatus,
        String rejectionReason,
        Instant approvedAt,
        Instant createdAt,
        Instant updatedAt
) implements Serializable {}
