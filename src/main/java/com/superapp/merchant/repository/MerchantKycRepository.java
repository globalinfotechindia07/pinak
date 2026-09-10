package com.superapp.merchant.repository;

import com.superapp.merchant.entity.MerchantKyc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchantKycRepository extends JpaRepository<MerchantKyc, UUID> {

    List<MerchantKyc> findByMerchantId(UUID merchantId);

    Optional<MerchantKyc> findFirstByMerchantIdOrderByCreatedAtDesc(UUID merchantId);
}
