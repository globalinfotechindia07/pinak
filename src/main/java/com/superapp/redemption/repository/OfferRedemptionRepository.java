package com.superapp.redemption.repository;

import com.superapp.redemption.entity.OfferRedemption;
import com.superapp.redemption.entity.RedemptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OfferRedemptionRepository extends JpaRepository<OfferRedemption, UUID> {

    Page<OfferRedemption> findByCustomerId(UUID customerId, Pageable pageable);

    Page<OfferRedemption> findByOfferId(UUID offerId, Pageable pageable);

    Page<OfferRedemption> findByStatus(RedemptionStatus status, Pageable pageable);

    Optional<OfferRedemption> findByPaymentId(UUID paymentId);
}
