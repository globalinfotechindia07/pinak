package com.superapp.wallet.repository;

import com.superapp.wallet.entity.MerchantWalletLedger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface MerchantWalletLedgerRepository extends JpaRepository<MerchantWalletLedger, UUID> {

    Page<MerchantWalletLedger> findByWalletIdOrderByCreatedAtDesc(UUID walletId, Pageable pageable);

    Page<MerchantWalletLedger> findByWalletIdAndStoreIdOrderByCreatedAtDesc(UUID walletId, UUID storeId, Pageable pageable);

    List<MerchantWalletLedger> findByWalletIdOrderByCreatedAtDesc(UUID walletId);

    @Query("SELECT SUM(l.amount) FROM MerchantWalletLedger l WHERE l.walletId = :walletId AND l.storeId = :storeId AND l.entryType = 'CREDIT'")
    BigDecimal sumGrossVolumeByStore(@Param("walletId") UUID walletId, @Param("storeId") UUID storeId);
}
