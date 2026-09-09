package com.superapp.payment.service;

import com.superapp.payment.dto.InitiatePaymentRequest;
import com.superapp.payment.dto.PaymentResponse;
import com.superapp.payment.dto.PaymentStatusResponse;
import com.superapp.payment.dto.PaymentWebhookRequest;
import com.superapp.payment.dto.RefundPaymentRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface PaymentService {

    PaymentResponse initiatePayment(InitiatePaymentRequest request, UUID customerId);

    PaymentResponse getPaymentById(UUID id);

    PaymentResponse getPaymentByReference(String reference);

    PaymentResponse processWebhook(PaymentWebhookRequest request);

    PaymentResponse refundPayment(UUID paymentId, RefundPaymentRequest request);

    Page<PaymentResponse> getCustomerPayments(UUID customerId, Pageable pageable);

    Page<PaymentResponse> getMerchantPayments(UUID merchantId, Pageable pageable);

    PaymentStatusResponse getPaymentStatus(UUID id);
}
