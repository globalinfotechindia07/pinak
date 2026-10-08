package com.superapp.wallet.repository;

import com.superapp.wallet.entity.MerchantWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchantWalletRepository extends JpaRepository<MerchantWallet, UUID> {

    Optional<MerchantWallet> findByMerchantId(UUID merchantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM MerchantWallet w WHERE w.merchantId = :merchantId")
    Optional<MerchantWallet> findByMerchantIdForUpdate(@Param("merchantId") UUID merchantId);
}
