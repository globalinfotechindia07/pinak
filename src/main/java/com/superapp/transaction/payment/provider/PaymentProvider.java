package com.superapp.transaction.payment.provider;

import com.superapp.transaction.payment.entity.Payment;

public interface PaymentProvider {

    String getProviderName();

    ProviderOrderResponse createOrder(Payment payment);

    boolean verifyWebhookSignature(String rawPayload, String signatureHeader);

    ProviderWebhookEvent parseWebhookEvent(String rawPayload);
}
