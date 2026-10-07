package com.superapp.transaction.reward.mapper;

import com.superapp.transaction.reward.dto.AdminRewardAdjustmentResponse;
import com.superapp.transaction.reward.dto.RewardBalanceResponse;
import com.superapp.transaction.reward.dto.RewardLedgerItemResponse;
import com.superapp.transaction.reward.entity.RewardAccount;
import com.superapp.transaction.reward.entity.RewardLedgerEntry;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class RewardMapper {

    public RewardBalanceResponse toBalanceResponse(RewardAccount account) {
        if (account == null) {
            return new RewardBalanceResponse(
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    "INR"
            );
        }
        return new RewardBalanceResponse(
                account.getAvailableBalance() != null ? account.getAvailableBalance() : BigDecimal.ZERO,
                account.getPendingBalance() != null ? account.getPendingBalance() : BigDecimal.ZERO,
                account.getLifetimeEarned() != null ? account.getLifetimeEarned() : BigDecimal.ZERO,
                account.getLifetimeRedeemed() != null ? account.getLifetimeRedeemed() : BigDecimal.ZERO,
                account.getCurrency() != null ? account.getCurrency() : "INR"
        );
    }

    public RewardLedgerItemResponse toLedgerItemResponse(RewardLedgerEntry entry) {
        if (entry == null) return null;
        return new RewardLedgerItemResponse(
                entry.getId(),
                entry.getType(),
                entry.getAmount(),
                entry.getStatus(),
                entry.getTransactionId(),
                entry.getRedemptionId(),
                entry.getReferenceId(),
                entry.getDescription(),
                entry.getCreatedAt()
        );
    }

    public AdminRewardAdjustmentResponse toAdjustmentResponse(RewardLedgerEntry entry) {
        if (entry == null) return null;
        return new AdminRewardAdjustmentResponse(
                entry.getId(),
                entry.getCustomerId(),
                entry.getType(),
                entry.getAmount(),
                entry.getStatus()
        );
    }
}
