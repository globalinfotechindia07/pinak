package com.superapp.transaction.payment.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.transaction.payment.dto.CreatePaymentRequest;
import com.superapp.transaction.payment.dto.PaymentCancelResponse;
import com.superapp.transaction.payment.dto.PaymentResponse;
import com.superapp.transaction.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments", description = "Payment initiation, lifecycle and status APIs")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Initiate payment for an eligible offer/store")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiatePayment(
            @Valid @RequestBody CreatePaymentRequest request,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID customerId = UUID.fromString(userDetails.getUsername());
        PaymentResponse response = paymentService.initiatePayment(request, customerId, idempotencyKey, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment initiated successfully", response));
    }

    @GetMapping("/{paymentId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Fetch payment status by ID")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID authenticatedUserId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        PaymentResponse response = paymentService.getPaymentById(paymentId, authenticatedUserId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Payment fetched successfully", response));
    }

    @PostMapping("/{paymentId}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cancel a pending or initiated payment")
    public ResponseEntity<ApiResponse<PaymentCancelResponse>> cancelPayment(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID authenticatedUserId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        PaymentCancelResponse response = paymentService.cancelPayment(paymentId, authenticatedUserId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Payment cancelled successfully", response));
    }
}
