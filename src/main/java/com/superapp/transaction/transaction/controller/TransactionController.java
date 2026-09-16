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
@RequestMapping("/api/v1/transactions")
@Tag(name = "Customer Transactions", description = "Transaction ledger and history APIs for customers")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get transaction history for authenticated customer")
    public ResponseEntity<ApiResponse<TransactionPageResponse>> getTransactions(
            @RequestParam(required = false) TransactionStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID authenticatedUserId = UUID.fromString(userDetails.getUsername());
        Page<TransactionListItemResponse> page = transactionService.getCustomerTransactions(
                authenticatedUserId, status, fromDate, toDate, pageable);

        return ResponseEntity.ok(ApiResponse.success("Transactions fetched successfully", TransactionPageResponse.of(page)));
    }

    @GetMapping("/{transactionId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get transaction details by ID for authenticated customer")
    public ResponseEntity<ApiResponse<TransactionDetailResponse>> getTransactionById(
            @PathVariable UUID transactionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID authenticatedUserId = UUID.fromString(userDetails.getUsername());
        TransactionDetailResponse response = transactionService.getCustomerTransactionById(transactionId, authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.success("Transaction fetched successfully", response));
    }
}

