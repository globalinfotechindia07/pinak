package com.superapp.reward;

import com.superapp.common.exception.AppException;
import com.superapp.reward.dto.RewardTransactionResponse;
import com.superapp.reward.entity.RewardAccount;
import com.superapp.reward.entity.RewardAccountStatus;
import com.superapp.reward.entity.RewardTransaction;
import com.superapp.reward.mapper.RewardMapper;
import com.superapp.reward.repository.RewardAccountRepository;
import com.superapp.reward.repository.RewardTransactionRepository;
import com.superapp.reward.service.RewardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RewardServiceSkeletonTest {

    @Mock private RewardAccountRepository rewardAccountRepository;
    @Mock private RewardTransactionRepository rewardTransactionRepository;
    @Spy private RewardMapper rewardMapper = new RewardMapper();

    @InjectMocks private RewardServiceImpl rewardService;

    private UUID customerId;
    private RewardAccount account;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        account = new RewardAccount(customerId);
        account.setId(UUID.randomUUID());
        account.setPointsBalance(500L);
        account.setStatus(RewardAccountStatus.ACTIVE);
    }

    @Test
    @DisplayName("addRewardPoints credits balance and creates transaction record")
    void addRewardPoints_success() {
        when(rewardAccountRepository.findByCustomerId(customerId)).thenReturn(Optional.of(account));
        when(rewardTransactionRepository.save(any(RewardTransaction.class))).thenAnswer(inv -> {
            RewardTransaction tx = inv.getArgument(0);
            tx.setId(UUID.randomUUID());
            return tx;
        });

        RewardTransactionResponse response = rewardService.addRewardPoints(
                customerId, 100L, "PAYMENT", "PAY_123", "Cashback reward");

        assertThat(response).isNotNull();
        assertThat(response.points()).isEqualTo(100L);
        assertThat(account.getPointsBalance()).isEqualTo(600L);
        verify(rewardAccountRepository).save(account);
    }

    @Test
    @DisplayName("addRewardPoints with negative/zero points throws 400 Validation error")
    void addRewardPoints_invalidPoints_throwsException() {
        assertThatThrownBy(() -> rewardService.addRewardPoints(
                customerId, -50L, "PAYMENT", "PAY_123", "Invalid"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("must be greater than 0");
    }

    @Test
    @DisplayName("deductRewardPoints debits balance when sufficient points exist")
    void deductRewardPoints_success() {
        when(rewardAccountRepository.findByCustomerId(customerId)).thenReturn(Optional.of(account));
        when(rewardTransactionRepository.save(any(RewardTransaction.class))).thenAnswer(inv -> {
            RewardTransaction tx = inv.getArgument(0);
            tx.setId(UUID.randomUUID());
            return tx;
        });

        RewardTransactionResponse response = rewardService.deductRewardPoints(
                customerId, 200L, "REDEMPTION", "RED_123", "Points redeemed");

        assertThat(response).isNotNull();
        assertThat(response.points()).isEqualTo(200L);
        assertThat(account.getPointsBalance()).isEqualTo(300L);
    }

    @Test
    @DisplayName("deductRewardPoints with insufficient points throws 400 error")
    void deductRewardPoints_insufficientPoints_throwsException() {
        when(rewardAccountRepository.findByCustomerId(customerId)).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> rewardService.deductRewardPoints(
                customerId, 1000L, "REDEMPTION", "RED_123", "Too many"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Insufficient reward points");
    }

    @Test
    @DisplayName("getRewardBalance returns current balance or 0 if account not yet created")
    void getRewardBalance_success() {
        when(rewardAccountRepository.findByCustomerId(customerId)).thenReturn(Optional.of(account));
        assertThat(rewardService.getRewardBalance(customerId)).isEqualTo(500L);

        UUID newCustomer = UUID.randomUUID();
        when(rewardAccountRepository.findByCustomerId(newCustomer)).thenReturn(Optional.empty());
        assertThat(rewardService.getRewardBalance(newCustomer)).isEqualTo(0L);
    }

    @Test
    @DisplayName("getRewardHistory returns paginated transaction history")
    void getRewardHistory_success() {
        when(rewardAccountRepository.findByCustomerId(customerId)).thenReturn(Optional.of(account));
        when(rewardTransactionRepository.findByRewardAccountId(eq(account.getId()), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));

        Page<RewardTransactionResponse> history = rewardService.getRewardHistory(customerId, PageRequest.of(0, 10));
        assertThat(history).isNotNull();
    }
}
