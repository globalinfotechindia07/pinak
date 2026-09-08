package com.superapp.transactionhistory.mapper;

import com.superapp.transactionhistory.dto.TransactionResponse;
import com.superapp.transactionhistory.entity.Transaction;
import org.springframework.stereotype.Component;

@Component
public class TransactionMapper {

    public TransactionResponse toResponse(Transaction transaction) {
        if (transaction == null) {
            return null;
        }
        return new TransactionResponse(
                transaction.getId(),
                transaction.getTransactionReference(),
                transaction.getPaymentId(),
                transaction.getCustomerId(),
                transaction.getMerchantId(),
                transaction.getStoreId(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getType(),
                transaction.getStatus(),
                transaction.getDescription(),
                transaction.getCreatedAt()
        );
    }
}
