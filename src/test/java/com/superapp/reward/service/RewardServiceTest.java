package com.superapp.reward.service;

import com.superapp.common.exception.AppException;
import com.superapp.reward.dto.EarnRewardRequest;
import com.superapp.reward.dto.RedeemRewardRequest;
import com.superapp.reward.dto.RewardAccountResponse;
import com.superapp.reward.dto.RewardTransactionResponse;
import com.superapp.reward.entity.RewardAccount;
import com.superapp.reward.entity.RewardTransaction;
import com.superapp.reward.entity.RewardTransactionType;
import com.superapp.reward.mapper.RewardMapper;
import com.superapp.reward.repository.RewardAccountRepository;
import com.superapp.reward.repository.RewardTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RewardServiceTest {

    @Mock RewardAccountRepository rewardAccountRepository;
    @Mock RewardTransactionRepository rewardTransactionRepository;
    @Spy RewardMapper rewardMapper = new RewardMapper();

    @InjectMocks RewardServiceImpl rewardService;

    private UUID customerId;
    private RewardAccount account;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        account = new RewardAccount(customerId);
        account.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("earnPoints increases pointsBalance and saves transaction")
    void earnPoints_success() {
        when(rewardAccountRepository.findByCustomerId(customerId)).thenReturn(Optional.of(account));
        when(rewardAccountRepository.save(any(RewardAccount.class))).thenAnswer(i -> i.getArgument(0));
        when(rewardTransactionRepository.save(any(RewardTransaction.class))).thenAnswer(i -> {
            RewardTransaction tx = i.getArgument(0);
            tx.setId(UUID.randomUUID());
            return tx;
        });

        var request = new EarnRewardRequest(customerId, 100, "PAYMENT", "PAY_123", "Cashback");
        RewardTransactionResponse response = rewardService.earnPoints(request);

        assertThat(response).isNotNull();
        assertThat(response.points()).isEqualTo(100);
        assertThat(response.type()).isEqualTo(RewardTransactionType.EARNED);
        assertThat(account.getPointsBalance()).isEqualTo(100);
        assertThat(account.getLifetimeEarned()).isEqualTo(100);
    }

    @Test
    @DisplayName("redeemPoints decreases pointsBalance when sufficient balance")
    void redeemPoints_success() {
        account.setPointsBalance(150);
        when(rewardAccountRepository.findByCustomerId(customerId)).thenReturn(Optional.of(account));
        when(rewardAccountRepository.save(any(RewardAccount.class))).thenAnswer(i -> i.getArgument(0));
        when(rewardTransactionRepository.save(any(RewardTransaction.class))).thenAnswer(i -> {
            RewardTransaction tx = i.getArgument(0);
            tx.setId(UUID.randomUUID());
            return tx;
        });

        var request = new RedeemRewardRequest(customerId, 50, "DISCOUNT", "PAY_123", "Bill discount");
        RewardTransactionResponse response = rewardService.redeemPoints(request);

        assertThat(response).isNotNull();
        assertThat(response.points()).isEqualTo(50);
        assertThat(response.type()).isEqualTo(RewardTransactionType.REDEEMED);
        assertThat(account.getPointsBalance()).isEqualTo(100);
        assertThat(account.getLifetimeRedeemed()).isEqualTo(50);
    }

    @Test
    @DisplayName("redeemPoints throws exception on insufficient balance")
    void redeemPoints_insufficientBalance_throws() {
        account.setPointsBalance(30);
        when(rewardAccountRepository.findByCustomerId(customerId)).thenReturn(Optional.of(account));

        var request = new RedeemRewardRequest(customerId, 50, "DISCOUNT", "PAY_123", "Bill discount");

        assertThatThrownBy(() -> rewardService.redeemPoints(request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Insufficient reward points");
    }
}
