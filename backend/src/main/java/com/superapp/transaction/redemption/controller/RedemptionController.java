package com.superapp.transaction.redemption.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.common.response.PaginationMeta;
import com.superapp.transaction.redemption.dto.CreateRedemptionRequest;
import com.superapp.transaction.redemption.dto.RedemptionHistoryResponse;
import com.superapp.transaction.redemption.dto.RedemptionResponse;
import com.superapp.transaction.redemption.service.RedemptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/redemptions")
@Tag(name = "Customer Redemptions", description = "Offer redemption and customer redemption history")
public class RedemptionController {

    private final RedemptionService redemptionService;

    public RedemptionController(RedemptionService redemptionService) {
        this.redemptionService = redemptionService;
    }

    @PostMapping
    @Operation(summary = "Redeem an eligible offer after verified payment", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('USER')")
    public ResponseEntity<ApiResponse<RedemptionResponse>> redeemOffer(
            @Valid @RequestBody CreateRedemptionRequest request,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID customerId = UUID.fromString(userDetails.getUsername());
        String effectiveRequestId = (requestId != null && !requestId.isBlank()) ? requestId : UUID.randomUUID().toString();

        RedemptionResponse response = redemptionService.redeemOffer(
                customerId, request, idempotencyKey, effectiveRequestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Offer redeemed successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get customer redemption history", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('USER')")
    public ResponseEntity<ApiResponse<?>> getCustomerRedemptions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID customerId = UUID.fromString(userDetails.getUsername());
        String effectiveRequestId = (requestId != null && !requestId.isBlank()) ? requestId : UUID.randomUUID().toString();

        Page<RedemptionHistoryResponse> page = redemptionService.getCustomerRedemptions(
                customerId, status, fromDate, toDate, pageable);

        return ResponseEntity.ok(ApiResponse.success(
                "Redemptions fetched successfully",
                page.getContent(),
                PaginationMeta.of(page)));
    }

    @GetMapping("/{redemptionId}")
    @Operation(summary = "Get redemption details by ID", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RedemptionResponse>> getRedemptionById(
            @PathVariable UUID redemptionId,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        RedemptionResponse response = redemptionService.getRedemptionById(redemptionId, currentUserId, isAdmin);

        return ResponseEntity.ok(ApiResponse.success("Redemption fetched successfully", response));
    }
}
