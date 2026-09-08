package com.superapp.payment.service.gateway;

import com.superapp.payment.entity.Payment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Mock UPI payment provider implementation.
 * Prepares the Payment module foundation for seamless plug-in of actual UPI providers (e.g. PhonePe/Razorpay/NPCI).
 */
@Component
public class MockUpiPaymentGateway implements PaymentGatewayProvider {

    private static final Logger log = LoggerFactory.getLogger(MockUpiPaymentGateway.class);
    private static final String VPA = "merchant.discovery@upi";
    private static final String MERCHANT_NAME = "SuperApp Merchant";

    @Override
    public PaymentGatewayOrder createPaymentIntent(Payment payment) {
        String gatewayOrderId = "UPI_ORD_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        // Standard NPCI UPI URI Specification
        String encodedName = URLEncoder.encode(MERCHANT_NAME, StandardCharsets.UTF_8);
        String encodedNote = URLEncoder.encode("Payment for Ref " + payment.getPaymentReference(), StandardCharsets.UTF_8);
        String upiIntentUrl = String.format(
                "upi://pay?pa=%s&pn=%s&mc=5411&tid=%s&tr=%s&tn=%s&am=%s&cu=%s",
                VPA,
                encodedName,
                gatewayOrderId,
                payment.getPaymentReference(),
                encodedNote,
                payment.getAmount().toPlainString(),
                payment.getCurrency()
        );

        log.info("💳 [UPI PROVIDER READY] Generated UPI intent URI: {} for payment ref={}",
                upiIntentUrl, payment.getPaymentReference());

        return new PaymentGatewayOrder(gatewayOrderId, upiIntentUrl, upiIntentUrl);
    }

    @Override
    public boolean verifyWebhookSignature(String payload, String signature) {
        // In real integration: HMAC-SHA256 verification against secret key
        // Foundation is ready for HMAC verification
        return true;
    }

    @Override
    public PaymentGatewayStatus checkStatus(String gatewayTransactionId) {
        return new PaymentGatewayStatus(true, false, null);
    }

    @Override
    public boolean processRefund(Payment payment, BigDecimal refundAmount, String reason) {
        log.info("💸 [UPI PROVIDER READY] Processed mock refund of amount={} for ref={}",
                refundAmount, payment.getPaymentReference());
        return true;
    }
}
