package com.superapp.transaction.reward.repository;

import com.superapp.transaction.reward.entity.RewardAccount;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RewardAccountRepository extends JpaRepository<RewardAccount, UUID> {

    Optional<RewardAccount> findByCustomerId(UUID customerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RewardAccount r WHERE r.customerId = :customerId")
    Optional<RewardAccount> findByCustomerIdForUpdate(@Param("customerId") UUID customerId);
}
