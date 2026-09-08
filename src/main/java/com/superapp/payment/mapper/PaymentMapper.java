package com.superapp.payment.mapper;

import com.superapp.payment.dto.PaymentResponse;
import com.superapp.payment.entity.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment payment) {
        return toResponse(payment, null, null);
    }

    public PaymentResponse toResponse(Payment payment, String upiIntentUrl, String qrCodeData) {
        if (payment == null) {
            return null;
        }
        return new PaymentResponse(
                payment.getId(),
                payment.getPaymentReference(),
                payment.getGatewayTransactionId(),
                payment.getCustomerId(),
                payment.getMerchantId(),
                payment.getStoreId(),
                payment.getOfferId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getPaymentMethod(),
                payment.getStatus(),
                payment.getFailureReason(),
                upiIntentUrl,
                qrCodeData,
                payment.getNotes(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }
}
