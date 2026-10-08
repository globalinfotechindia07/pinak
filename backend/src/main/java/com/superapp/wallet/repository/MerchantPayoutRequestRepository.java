package com.superapp.wallet.repository;

import com.superapp.wallet.entity.MerchantPayoutRequest;
import com.superapp.wallet.enums.PayoutStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchantPayoutRequestRepository extends JpaRepository<MerchantPayoutRequest, UUID> {

    Page<MerchantPayoutRequest> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId, Pageable pageable);

    Optional<MerchantPayoutRequest> findByIdempotencyKey(UUID idempotencyKey);

    Optional<MerchantPayoutRequest> findByProviderPayoutId(String providerPayoutId);

    List<MerchantPayoutRequest> findByStatus(PayoutStatus status);
}
