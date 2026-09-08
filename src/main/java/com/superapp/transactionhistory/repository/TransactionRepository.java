package com.superapp.transactionhistory.repository;

import com.superapp.transactionhistory.entity.Transaction;
import com.superapp.transactionhistory.entity.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    Optional<Transaction> findByTransactionReference(String transactionReference);

    Page<Transaction> findByCustomerId(UUID customerId, Pageable pageable);

    Page<Transaction> findByMerchantId(UUID merchantId, Pageable pageable);

    Page<Transaction> findByCustomerIdAndType(UUID customerId, TransactionType type, Pageable pageable);
}
