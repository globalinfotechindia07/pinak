package com.superapp.transaction.redemption.repository;

import com.superapp.transaction.redemption.entity.Redemption;
import com.superapp.transaction.redemption.enums.RedemptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RedemptionRepository extends JpaRepository<Redemption, UUID>, JpaSpecificationExecutor<Redemption> {

    Optional<Redemption> findByCustomerIdAndIdempotencyKey(UUID customerId, String idempotencyKey);

    Optional<Redemption> findByPaymentIdAndOfferId(UUID paymentId, UUID offerId);

    Optional<Redemption> findByCustomerIdAndPaymentIdAndOfferId(UUID customerId, UUID paymentId, UUID offerId);

    Optional<Redemption> findByPaymentId(UUID paymentId);

    long countByCustomerIdAndOfferIdAndStatus(UUID customerId, UUID offerId, RedemptionStatus status);

    long countByOfferIdAndStatus(UUID offerId, RedemptionStatus status);

    Page<Redemption> findByCustomerId(UUID customerId, Pageable pageable);
}
