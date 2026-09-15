package com.superapp.transaction.payment.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.enums.PaymentIntentType;
import com.superapp.transaction.payment.enums.PaymentProviderType;
import com.superapp.transaction.payment.enums.PaymentStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

@Component
public class MockUpiPaymentProvider implements PaymentProvider {

    private static final Logger log = LoggerFactory.getLogger(MockUpiPaymentProvider.class);

    private final ObjectMapper objectMapper;
    private final String webhookSecret;

    public MockUpiPaymentProvider(
            ObjectMapper objectMapper,
            @Value("${app.payment.provider.mock.webhook-secret:mock-webhook-secret-key-superapp}") String webhookSecret) {
        this.objectMapper = objectMapper;
        this.webhookSecret = webhookSecret;
    }

    @Override
    public String getProviderName() {
        return PaymentProviderType.MOCK_UPI.name();
    }

    @Override
    public ProviderOrderResponse createOrder(Payment payment) {
        String providerOrderId = "ord_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String tid = "txn_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);

        // Standard NPCI UPI Intent URI format
        String intentValue = "upi://pay?pa=superapp@icici" +
                "&pn=MerchantDiscovery" +
                "&mc=5411" +
                "&tid=" + tid +
                "&tr=" + payment.getId() +
                "&tn=Payment_For_Order_" + providerOrderId +
                "&am=" + payment.getPayableAmount().toPlainString() +
                "&cu=" + payment.getCurrency();

        Instant expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);

        return new ProviderOrderResponse(
                getProviderName(),
                providerOrderId,
                PaymentIntentType.UPI,
                intentValue,
                expiresAt
        );
    }

    @Override
    public boolean verifyWebhookSignature(String rawPayload, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            log.warn("Missing webhook signature header");
            return false;
        }

        // Allow test signature in development / test environments
        if ("valid_test_signature".equals(signatureHeader)) {
            return true;
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
            String expectedHex = HexFormat.of().formatHex(hmacBytes);

            return MessageDigest.isEqual(
                    expectedHex.getBytes(StandardCharsets.UTF_8),
                    signatureHeader.trim().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Error computing HMAC signature: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public ProviderWebhookEvent parseWebhookEvent(String rawPayload) {
        try {
            JsonNode root = objectMapper.readTree(rawPayload);

            String eventId = root.hasNonNull("eventId") ? root.get("eventId").asText() :
                    (root.hasNonNull("id") ? root.get("id").asText() : "evt_" + UUID.randomUUID());

            String eventType = root.hasNonNull("eventType") ? root.get("eventType").asText() :
                    (root.hasNonNull("event") ? root.get("event").asText() : "payment.success");

            UUID paymentId = root.hasNonNull("paymentId") ? UUID.fromString(root.get("paymentId").asText()) : null;
            String providerOrderId = root.hasNonNull("providerOrderId") ? root.get("providerOrderId").asText() : null;
            String providerPaymentId = root.hasNonNull("providerPaymentId") ? root.get("providerPaymentId").asText() :
                    "pay_gateway_" + UUID.randomUUID().toString().substring(0, 8);

            BigDecimal amount = root.hasNonNull("amount") ? new BigDecimal(root.get("amount").asText()) : null;
            String currency = root.hasNonNull("currency") ? root.get("currency").asText() : "INR";

            String rawStatus = root.hasNonNull("status") ? root.get("status").asText().toUpperCase() : "SUCCESS";
            PaymentStatus status;
            try {
                status = PaymentStatus.valueOf(rawStatus);
            } catch (Exception ex) {
                status = "SUCCESS".equalsIgnoreCase(rawStatus) ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
            }

            String failureCode = root.hasNonNull("failureCode") ? root.get("failureCode").asText() : null;
            String failureReason = root.hasNonNull("failureReason") ? root.get("failureReason").asText() : null;

            return new ProviderWebhookEvent(
                    eventId,
                    eventType,
                    paymentId,
                    providerOrderId,
                    providerPaymentId,
                    amount,
                    currency,
                    status,
                    failureCode,
                    failureReason
            );
        } catch (Exception e) {
            log.error("Failed to parse provider webhook payload: {}", e.getMessage());
            throw new AppException("Invalid webhook payload", ApiError.VALIDATION_FAILED, 400);
        }
    }
}
