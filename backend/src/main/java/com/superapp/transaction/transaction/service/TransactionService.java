package com.superapp.transaction.transaction.service;

import com.superapp.transaction.transaction.dto.TransactionDetailResponse;
import com.superapp.transaction.transaction.dto.TransactionListItemResponse;
import com.superapp.transaction.transaction.dto.TransactionResponse;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.UUID;

public interface TransactionService {

    // Customer operations
    Page<TransactionListItemResponse> getCustomerTransactions(
            UUID customerId,
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable
    );

    TransactionDetailResponse getCustomerTransactionById(UUID transactionId, UUID customerId);

    // Merchant operations
    Page<TransactionListItemResponse> getMerchantTransactions(
            UUID merchantOwnerUserId,
            UUID storeId,
            UUID offerId,
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable
    );

    TransactionDetailResponse getMerchantTransactionById(UUID transactionId, UUID merchantOwnerUserId);

    // Admin operations
    Page<TransactionListItemResponse> getAdminTransactions(
            UUID customerId,
            UUID merchantId,
            UUID storeId,
            UUID offerId,
            UUID paymentId,
            UUID redemptionId,
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            String search,
            Pageable pageable,
            UUID adminUserId,
            String requestId
    );

    TransactionDetailResponse getAdminTransactionById(UUID transactionId, UUID adminUserId, String requestId);

    // Backwards compatibility methods
    TransactionResponse getTransactionById(UUID transactionId, UUID authenticatedUserId, boolean isAdmin);

    Page<TransactionResponse> getAllTransactions(
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable
    );

    Page<TransactionResponse> getMerchantTransactions(
            UUID merchantOwnerUserId,
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable
    );
}
