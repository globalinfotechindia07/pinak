package com.superapp.transaction.payment.repository;

import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByCustomerIdAndIdempotencyKey(UUID customerId, String idempotencyKey);

    Optional<Payment> findByProviderOrderId(String providerOrderId);

    Optional<Payment> findByPaymentReference(String paymentReference);

    Page<Payment> findByCustomerId(UUID customerId, Pageable pageable);

    Page<Payment> findByMerchantId(UUID merchantId, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.customerId = :customerId " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:fromDate IS NULL OR p.createdAt >= :fromDate) " +
           "AND (:toDate IS NULL OR p.createdAt <= :toDate)")
    Page<Payment> findCustomerPaymentsFiltered(
            @Param("customerId") UUID customerId,
            @Param("status") PaymentStatus status,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            Pageable pageable
    );
}
