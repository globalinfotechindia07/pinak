package com.superapp.transaction.reward.service;

import com.superapp.transaction.reward.dto.AdminRewardAdjustmentRequest;
import com.superapp.transaction.reward.dto.AdminRewardAdjustmentResponse;
import com.superapp.transaction.reward.dto.RewardBalanceResponse;
import com.superapp.transaction.reward.dto.RewardLedgerItemResponse;
import com.superapp.transaction.reward.entity.RewardAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public interface RewardService {

    RewardBalanceResponse getRewardBalance(UUID customerId);

    Page<RewardLedgerItemResponse> getCustomerLedger(
            UUID customerId, String type, String status, Instant fromDate, Instant toDate, Pageable pageable);

    RewardLedgerItemResponse getLedgerEntryById(UUID entryId, UUID currentUserId, boolean isAdmin);

    RewardLedgerItemResponse creditRedemptionReward(
            UUID customerId, UUID redemptionId, UUID transactionId, BigDecimal amount, String description);

    RewardLedgerItemResponse reverseReward(
            UUID ledgerEntryId, String reason, String requestId, UUID adminUserId);

    AdminRewardAdjustmentResponse adjustReward(
            AdminRewardAdjustmentRequest request, String idempotencyKey, String requestId, UUID adminUserId);

    Page<RewardLedgerItemResponse> getAdminLedger(
            UUID customerId, String type, String status, Instant fromDate, Instant toDate, Pageable pageable);

    RewardAccount getOrCreateAccount(UUID customerId);
}
