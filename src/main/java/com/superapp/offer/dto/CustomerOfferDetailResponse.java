package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CustomerOfferDetailResponse(
        String id,
        StoreSummaryRef store,
        MerchantSummaryRef merchant,
        String title,
        String description,
        String offerType,
        BigDecimal value,
        BigDecimal minTransactionAmount,
        BigDecimal maxDiscountAmount,
        Instant validFrom,
        Instant validTo,
        String status
) implements Serializable {}
