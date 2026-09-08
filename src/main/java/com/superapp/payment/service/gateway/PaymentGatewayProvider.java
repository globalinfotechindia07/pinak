package com.superapp.payment.service.gateway;

import com.superapp.payment.entity.Payment;

/**
 * Abstraction interface for payment providers (e.g. Razorpay, Cashfree, PhonePe, Paytm, NPCI UPI).
 * Prepares the Payment module foundation so real UPI integrations can be plugged in seamlessly.
 */
public interface PaymentGatewayProvider {

    /**
     * Initializes a payment order/intent with the gateway.
     * Generates a UPI intent URI (upi://pay?...) and gateway order ID.
     */
    PaymentGatewayOrder createPaymentIntent(Payment payment);

    /**
     * Validates incoming webhook signature from the gateway.
     */
    boolean verifyWebhookSignature(String payload, String signature);

    /**
     * Queries gateway for current transaction status.
     */
    PaymentGatewayStatus checkStatus(String gatewayTransactionId);

    /**
     * Initiates a refund request with the gateway provider.
     */
    boolean processRefund(Payment payment, java.math.BigDecimal refundAmount, String reason);

    record PaymentGatewayOrder(
            String gatewayOrderId,
            String upiIntentUrl,
            String qrCodeData
    ) {}

    record PaymentGatewayStatus(
            boolean isSuccessful,
            boolean isFailed,
            String failureMessage
    ) {}
}
