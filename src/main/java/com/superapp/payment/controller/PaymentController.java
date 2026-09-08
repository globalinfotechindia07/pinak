package com.superapp.payment.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.payment.dto.InitiatePaymentRequest;
import com.superapp.payment.dto.PaymentResponse;
import com.superapp.payment.dto.PaymentWebhookRequest;
import com.superapp.payment.dto.RefundPaymentRequest;
import com.superapp.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments", description = "UPI payment initiation, verification, and webhook handling")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/initiate")
    @Operation(summary = "Initiate a new payment intent (UPI/Card)", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiatePayment(
            @Valid @RequestBody InitiatePaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID customerId = UUID.fromString(userDetails.getUsername());
        PaymentResponse response = paymentService.initiatePayment(request, customerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment initiated successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payment details by ID", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved", paymentService.getPaymentById(id)));
    }

    @GetMapping("/reference/{reference}")
    @Operation(summary = "Get payment details by reference code", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByReference(@PathVariable String reference) {
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved", paymentService.getPaymentByReference(reference)));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Payment gateway callback webhook (NPCI/UPI/Gateway)")
    public ResponseEntity<ApiResponse<PaymentResponse>> handleWebhook(
            @Valid @RequestBody PaymentWebhookRequest request) {

        PaymentResponse response = paymentService.processWebhook(request);
        return ResponseEntity.ok(ApiResponse.success("Webhook processed", response));
    }

    @PostMapping("/{id}/refund")
    @Operation(summary = "Process a refund for a successful payment", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PaymentResponse>> refundPayment(
            @PathVariable UUID id,
            @Valid @RequestBody RefundPaymentRequest request) {

        PaymentResponse response = paymentService.refundPayment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Refund processed successfully", response));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get customer payment history", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> getCustomerPayments(
            @PathVariable UUID customerId,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(ApiResponse.success("Customer payments retrieved",
                paymentService.getCustomerPayments(customerId, pageable)));
    }

    @GetMapping("/merchant/{merchantId}")
    @Operation(summary = "Get merchant payment list", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> getMerchantPayments(
            @PathVariable UUID merchantId,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(ApiResponse.success("Merchant payments retrieved",
                paymentService.getMerchantPayments(merchantId, pageable)));
    }
}
