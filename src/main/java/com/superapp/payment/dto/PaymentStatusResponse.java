package com.superapp.payment.dto;

import com.superapp.payment.entity.Payment;
import com.superapp.payment.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentStatusResponse(
        UUID paymentId,
        PaymentStatus status,
        String paymentReference,
        String gatewayTransactionId,
        BigDecimal amount,
        String currency,
        String failureReason,
        Instant updatedAt
) {
    public static PaymentStatusResponse fromEntity(Payment payment) {
        if (payment == null) return null;
        return new PaymentStatusResponse(
                payment.getId(),
                payment.getStatus(),
                payment.getPaymentReference(),
                payment.getGatewayTransactionId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getFailureReason(),
                payment.getUpdatedAt()
        );
    }
}
