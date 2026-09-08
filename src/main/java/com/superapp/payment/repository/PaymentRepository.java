package com.superapp.payment.repository;

import com.superapp.payment.entity.Payment;
import com.superapp.payment.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByPaymentReference(String paymentReference);

    Page<Payment> findByCustomerId(UUID customerId, Pageable pageable);

    Page<Payment> findByMerchantId(UUID merchantId, Pageable pageable);

    Page<Payment> findByStatus(PaymentStatus status, Pageable pageable);
}
