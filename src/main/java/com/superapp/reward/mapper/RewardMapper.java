package com.superapp.reward.mapper;

import com.superapp.reward.dto.RewardAccountResponse;
import com.superapp.reward.dto.RewardTransactionResponse;
import com.superapp.reward.entity.RewardAccount;
import com.superapp.reward.entity.RewardTransaction;
import org.springframework.stereotype.Component;

@Component
public class RewardMapper {

    public RewardAccountResponse toResponse(RewardAccount account) {
        if (account == null) {
            return null;
        }
        return new RewardAccountResponse(
                account.getId(),
                account.getCustomerId(),
                account.getPointsBalance(),
                account.getLifetimeEarned(),
                account.getLifetimeRedeemed(),
                account.getStatus(),
                account.getUpdatedAt()
        );
    }

    public RewardTransactionResponse toResponse(RewardTransaction transaction) {
        if (transaction == null) {
            return null;
        }
        return new RewardTransactionResponse(
                transaction.getId(),
                transaction.getRewardAccountId(),
                transaction.getPoints(),
                transaction.getType(),
                transaction.getReferenceType(),
                transaction.getReferenceId(),
                transaction.getDescription(),
                transaction.getCreatedAt()
        );
    }
}
