package com.superapp.redemption.dto;

import com.superapp.redemption.entity.OfferRedemption;
import com.superapp.redemption.entity.RedemptionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record RedemptionResponse(
        UUID id,
        UUID offerId,
        UUID customerId,
        UUID storeId,
        BigDecimal billAmount,
        BigDecimal discountAmount,
        BigDecimal payableAmount,
        UUID paymentId,
        RedemptionStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static RedemptionResponse fromEntity(OfferRedemption r) {
        if (r == null) return null;
        return new RedemptionResponse(
                r.getId(),
                r.getOfferId(),
                r.getCustomerId(),
                r.getStoreId(),
                r.getBillAmount(),
                r.getDiscountAmount(),
                r.getPayableAmount(),
                r.getPaymentId(),
                r.getStatus(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
