package com.superapp.transaction.payment.webhook;

import com.superapp.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments/webhooks")
@Tag(name = "Payment Webhooks", description = "Provider payment webhook ingestion")
public class PaymentWebhookController {

    private final PaymentWebhookService paymentWebhookService;

    public PaymentWebhookController(PaymentWebhookService paymentWebhookService) {
        this.paymentWebhookService = paymentWebhookService;
    }

    @PostMapping("/{provider}")
    @Operation(summary = "Process inbound payment provider webhook")
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleWebhook(
            @PathVariable String provider,
            @RequestBody String rawPayload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signatureHeader,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String razorpaySignature,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId) {

        String signature = signatureHeader != null ? signatureHeader : razorpaySignature;
        Map<String, Object> result = paymentWebhookService.processWebhook(provider, rawPayload, signature, requestId);

        return ResponseEntity.ok(ApiResponse.success("Webhook processed successfully", result));
    }
}
