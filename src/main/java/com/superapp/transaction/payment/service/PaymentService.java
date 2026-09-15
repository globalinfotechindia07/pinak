package com.superapp.transaction.payment.service;

import com.superapp.transaction.payment.dto.CreatePaymentRequest;
import com.superapp.transaction.payment.dto.PaymentCancelResponse;
import com.superapp.transaction.payment.dto.PaymentResponse;

import java.util.UUID;

public interface PaymentService {

    PaymentResponse initiatePayment(CreatePaymentRequest request, UUID customerId, String idempotencyKey, String requestId);

    PaymentResponse getPaymentById(UUID paymentId, UUID authenticatedUserId, boolean isAdmin);

    PaymentCancelResponse cancelPayment(UUID paymentId, UUID authenticatedUserId, boolean isAdmin);
}
