package com.superapp.wallet.controller;

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

    public PayoutWebhookController(MerchantPayoutService payoutService) {
        this.payoutService = payoutService;
    }

    @PostMapping("/{provider}")
    public ResponseEntity<ApiResponse<String>> handlePayoutWebhook(
            @PathVariable("provider") String provider,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String rzpSignature,
            @RequestHeader(value = "X-Cashfree-Signature", required = false) String cfSignature,
            @RequestHeader(value = "X-Signature", required = false) String genericSignature,
            @RequestBody String rawPayload,
            @RequestBody(required = false) WebhookPayloadDto payloadDto) {

        String signature = rzpSignature != null ? rzpSignature : (cfSignature != null ? cfSignature : genericSignature);
        log.info("Received banking payout webhook for provider={} sig={}", provider, signature);

        payoutService.processPayoutWebhook(payloadDto, rawPayload, signature, provider);

        return ResponseEntity.ok(ApiResponse.success("Webhook processed successfully", "OK"));
    }
}
