package com.superapp.transaction.payment.webhook;

import java.util.Map;

public interface PaymentWebhookService {

    Map<String, Object> processWebhook(String providerName, String rawPayload, String signatureHeader, String requestId);
}
