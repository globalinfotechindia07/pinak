package com.superapp.transactionhistory.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.transactionhistory.dto.TransactionResponse;
import com.superapp.transactionhistory.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@Tag(name = "Transactions", description = "Transaction history and ledger monitoring")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction by ID")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TransactionResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Transaction retrieved", transactionService.getTransactionById(id)));
    }

    @GetMapping("/reference/{reference}")
    @Operation(summary = "Get transaction by reference")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TransactionResponse>> getByReference(@PathVariable String reference) {
        return ResponseEntity.ok(ApiResponse.success("Transaction retrieved", transactionService.getTransactionByReference(reference)));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get customer transactions (paginated)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getCustomerTransactions(
            @PathVariable UUID customerId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success("Customer transactions retrieved",
                transactionService.getCustomerTransactions(customerId, pageable)));
    }

    @GetMapping("/merchant/{merchantId}")
    @Operation(summary = "Get merchant transactions (paginated)")
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getMerchantTransactions(
            @PathVariable UUID merchantId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success("Merchant transactions retrieved",
                transactionService.getMerchantTransactions(merchantId, pageable)));
    }

    @GetMapping
    @Operation(summary = "List all transactions (Admin)")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getAllTransactions(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success("Transactions retrieved",
                transactionService.getAllTransactions(pageable)));
    }
}
