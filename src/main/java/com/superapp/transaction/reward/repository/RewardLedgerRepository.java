package com.superapp.transaction.reward.repository;

import com.superapp.transaction.reward.entity.RewardLedgerEntry;
import com.superapp.transaction.reward.enums.RewardLedgerType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RewardLedgerRepository extends JpaRepository<RewardLedgerEntry, UUID>, JpaSpecificationExecutor<RewardLedgerEntry> {

    Optional<RewardLedgerEntry> findByRedemptionIdAndType(UUID redemptionId, RewardLedgerType type);

    Optional<RewardLedgerEntry> findByReferenceIdAndType(String referenceId, RewardLedgerType type);

    Optional<RewardLedgerEntry> findByReferenceId(String referenceId);

    Page<RewardLedgerEntry> findByCustomerId(UUID customerId, Pageable pageable);
}
