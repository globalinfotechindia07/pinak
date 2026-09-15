package com.superapp.transaction.payment.mapper;

import com.superapp.transaction.payment.dto.PaymentIntentDto;
import com.superapp.transaction.payment.dto.PaymentResponse;
import com.superapp.transaction.payment.entity.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment payment) {
        return toResponse(payment, null);
    }

    public PaymentResponse toResponse(Payment payment, PaymentIntentDto intent) {
        if (payment == null) {
            return null;
        }
        return new PaymentResponse(
                payment.getId(),
                payment.getTransactionId(),
                payment.getStatus(),
                payment.getCurrency(),
                payment.getGrossAmount(),
                payment.getDiscountAmount(),
                payment.getPayableAmount(),
                payment.getProvider(),
                payment.getProviderOrderId(),
                intent,
                payment.getExpiresAt(),
                payment.getPaidAt()
        );
    }
}
