package com.superapp.transactionhistory.service;

import com.superapp.transactionhistory.dto.TransactionResponse;
import com.superapp.transactionhistory.entity.Transaction;
import com.superapp.transactionhistory.entity.TransactionStatus;
import com.superapp.transactionhistory.entity.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.UUID;

public interface TransactionService {

    Transaction recordTransaction(
            String reference,
            UUID paymentId,
            UUID customerId,
            UUID merchantId,
            UUID storeId,
            BigDecimal amount,
            String currency,
            TransactionType type,
            TransactionStatus status,
            String description
    );

    TransactionResponse getTransactionById(UUID id);

    TransactionResponse getTransactionByReference(String reference);

    Page<TransactionResponse> getCustomerTransactions(UUID customerId, Pageable pageable);

    Page<TransactionResponse> getMerchantTransactions(UUID merchantId, Pageable pageable);

    Page<TransactionResponse> getAllTransactions(Pageable pageable);
}
