package com.superapp.reward.repository;

import com.superapp.reward.entity.RewardAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RewardAccountRepository extends JpaRepository<RewardAccount, UUID> {

    Optional<RewardAccount> findByCustomerId(UUID customerId);
}
