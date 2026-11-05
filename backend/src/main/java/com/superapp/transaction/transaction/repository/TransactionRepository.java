package com.superapp.transaction.transaction.repository;

import com.superapp.transaction.transaction.entity.Transaction;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    Optional<Transaction> findByTransactionReference(String transactionReference);

    Optional<Transaction> findByPaymentId(UUID paymentId);

    Optional<Transaction> findByProviderTransactionId(String providerTransactionId);

    Optional<Transaction> findByRedemptionId(UUID redemptionId);

    Optional<Transaction> findByIdAndCustomerId(UUID id, UUID customerId);

    Page<Transaction> findByCustomerId(UUID customerId, Pageable pageable);

    Page<Transaction> findByMerchantId(UUID merchantId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.customerId = :customerId " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:fromDate IS NULL OR t.createdAt >= :fromDate) " +
           "AND (:toDate IS NULL OR t.createdAt <= :toDate)")
    Page<Transaction> findCustomerTransactionsFiltered(
            @Param("customerId") UUID customerId,
            @Param("status") TransactionStatus status,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            Pageable pageable
    );

    @Query("SELECT t FROM Transaction t WHERE t.storeId IN :storeIds " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:fromDate IS NULL OR t.createdAt >= :fromDate) " +
           "AND (:toDate IS NULL OR t.createdAt <= :toDate)")
    Page<Transaction> findMerchantTransactionsFiltered(
            @Param("storeIds") Collection<UUID> storeIds,
            @Param("status") TransactionStatus status,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            Pageable pageable
    );

    @Query("SELECT t FROM Transaction t WHERE " +
           "(:status IS NULL OR t.status = :status) " +
           "AND (:fromDate IS NULL OR t.createdAt >= :fromDate) " +
           "AND (:toDate IS NULL OR t.createdAt <= :toDate)")
    Page<Transaction> findAllFiltered(
            @Param("status") TransactionStatus status,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            Pageable pageable
    );

    long countByStatus(TransactionStatus status);

    @Query("SELECT COALESCE(SUM(t.grossAmount), 0) FROM Transaction t WHERE t.status = com.superapp.transaction.transaction.enums.TransactionStatus.SUCCESS")
    BigDecimal sumGrossGmv();

    @Query("SELECT COALESCE(SUM(t.payableAmount), 0) FROM Transaction t WHERE t.status = com.superapp.transaction.transaction.enums.TransactionStatus.SUCCESS")
    BigDecimal sumNetCollected();

    @Query("SELECT COALESCE(SUM(t.discountAmount), 0) FROM Transaction t WHERE t.status = com.superapp.transaction.transaction.enums.TransactionStatus.SUCCESS")
    BigDecimal sumDiscounts();

    @Query("SELECT COUNT(DISTINCT t.merchantId) FROM Transaction t WHERE t.merchantId IS NOT NULL")
    long countDistinctMerchants();

    @Query("SELECT COUNT(DISTINCT t.storeId) FROM Transaction t WHERE t.storeId IS NOT NULL")
    long countDistinctStores();
}
