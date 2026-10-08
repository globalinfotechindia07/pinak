package com.superapp.wallet.repository;

import com.superapp.wallet.entity.MerchantBankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchantBankAccountRepository extends JpaRepository<MerchantBankAccount, UUID> {

    List<MerchantBankAccount> findByMerchantId(UUID merchantId);

    Optional<MerchantBankAccount> findByMerchantIdAndIsPrimaryTrue(UUID merchantId);
}
