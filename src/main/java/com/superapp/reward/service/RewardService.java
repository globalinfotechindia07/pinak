package com.superapp.reward.service;

import com.superapp.reward.dto.EarnRewardRequest;
import com.superapp.reward.dto.RedeemRewardRequest;
import com.superapp.reward.dto.RewardAccountResponse;
import com.superapp.reward.dto.RewardTransactionResponse;
import com.superapp.reward.entity.RewardAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface RewardService {

    RewardAccount getOrCreateAccount(UUID customerId);

    RewardAccountResponse getAccountResponse(UUID customerId);

    RewardTransactionResponse earnPoints(EarnRewardRequest request);

    RewardTransactionResponse redeemPoints(RedeemRewardRequest request);

    Page<RewardTransactionResponse> getHistory(UUID customerId, Pageable pageable);
}
