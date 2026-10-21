package com.superapp.wallet.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.common.response.ApiResponse;
import com.superapp.wallet.dto.WebhookPayloadDto;
import com.superapp.wallet.service.MerchantPayoutService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks/payouts")
public class PayoutWebhookController {

    private static final Logger log = LoggerFactory.getLogger(PayoutWebhookController.class);
    private final MerchantPayoutService payoutService;
    private final ObjectMapper objectMapper;

    public PayoutWebhookController(MerchantPayoutService payoutService, ObjectMapper objectMapper) {
        this.payoutService = payoutService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/{provider}")
    public ResponseEntity<ApiResponse<String>> handlePayoutWebhook(
            @PathVariable("provider") String provider,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String rzpSignature,
            @RequestHeader(value = "X-Cashfree-Signature", required = false) String cfSignature,
            @RequestHeader(value = "X-Signature", required = false) String genericSignature,
            @RequestBody String rawPayload) {

        String signature = rzpSignature != null ? rzpSignature : (cfSignature != null ? cfSignature : genericSignature);
        log.info("Received banking payout webhook for provider={} sig={}", provider, signature);

        WebhookPayloadDto payloadDto = null;
        if (rawPayload != null && !rawPayload.isBlank()) {
            try {
                payloadDto = objectMapper.readValue(rawPayload, WebhookPayloadDto.class);
            } catch (Exception e) {
                log.warn("Failed to parse payout webhook payload JSON: {}", e.getMessage());
            }
        }

        payoutService.processPayoutWebhook(payloadDto, rawPayload, signature, provider);

        return ResponseEntity.ok(ApiResponse.success("Webhook processed successfully", "OK"));
    }
}
