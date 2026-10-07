package com.superapp.transaction.transaction.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.transaction.transaction.dto.TransactionDetailResponse;
import com.superapp.transaction.transaction.dto.TransactionListItemResponse;
import com.superapp.transaction.transaction.dto.TransactionPageResponse;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import com.superapp.transaction.transaction.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/transactions")
@Tag(name = "Admin Transactions", description = "Platform-wide transaction management, search, and audit APIs for administrators")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminTransactionController {

    private final TransactionService transactionService;

    public AdminTransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    @Operation(summary = "Search and filter all platform transactions with pagination")
    public ResponseEntity<ApiResponse<TransactionPageResponse>> getAdminTransactions(
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID merchantId,
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) UUID offerId,
            @RequestParam(required = false) UUID paymentId,
            @RequestParam(required = false) UUID redemptionId,
            @RequestParam(required = false) TransactionStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {

        UUID adminUserId = UUID.fromString(userDetails.getUsername());
        String requestId = request.getHeader("X-Request-Id");

        Page<TransactionListItemResponse> page = transactionService.getAdminTransactions(
                customerId,
                merchantId,
                storeId,
                offerId,
                paymentId,
                redemptionId,
                status,
                fromDate,
                toDate,
                search,
                pageable,
                adminUserId,
                requestId
        );

        return ResponseEntity.ok(ApiResponse.success("Admin transactions fetched successfully", TransactionPageResponse.of(page)));
    }

    @GetMapping("/{transactionId}")
    @Operation(summary = "Get full transaction details across platform with audit logging")
    public ResponseEntity<ApiResponse<TransactionDetailResponse>> getAdminTransactionById(
            @PathVariable UUID transactionId,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {

        UUID adminUserId = UUID.fromString(userDetails.getUsername());
        String requestId = request.getHeader("X-Request-Id");

        TransactionDetailResponse response = transactionService.getAdminTransactionById(transactionId, adminUserId, requestId);
        return ResponseEntity.ok(ApiResponse.success("Admin transaction fetched successfully", response));
    }
}
