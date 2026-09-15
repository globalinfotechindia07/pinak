package com.superapp.transaction.transaction.service;

import com.superapp.transaction.transaction.dto.TransactionResponse;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.UUID;

public interface TransactionService {

    Page<TransactionResponse> getCustomerTransactions(
            UUID customerId,
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable
    );

    TransactionResponse getTransactionById(UUID transactionId, UUID authenticatedUserId, boolean isAdmin);

    Page<TransactionResponse> getMerchantTransactions(
            UUID merchantOwnerUserId,
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable
    );

    Page<TransactionResponse> getAllTransactions(
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable
    );
}
