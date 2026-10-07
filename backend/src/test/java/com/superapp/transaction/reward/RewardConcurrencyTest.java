package com.superapp.transaction.reward;

import com.superapp.common.audit.AuditService;
import com.superapp.transaction.reward.dto.RewardLedgerItemResponse;
import com.superapp.transaction.reward.entity.RewardAccount;
import com.superapp.transaction.reward.entity.RewardLedgerEntry;
import com.superapp.transaction.reward.enums.RewardLedgerStatus;
import com.superapp.transaction.reward.enums.RewardLedgerType;
import com.superapp.transaction.reward.mapper.RewardMapper;
import com.superapp.transaction.reward.repository.RewardAccountRepository;
import com.superapp.transaction.reward.repository.RewardLedgerRepository;
import com.superapp.transaction.reward.service.RewardCacheService;
import com.superapp.transaction.reward.service.RewardServiceImpl;
import com.superapp.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RewardConcurrencyTest {

    @Mock private RewardAccountRepository rewardAccountRepository;
    @Mock private RewardLedgerRepository rewardLedgerRepository;
    @Mock private RewardCacheService rewardCacheService;
    @Mock private UserRepository userRepository;
    @Mock private AuditService auditService;

    private RewardServiceImpl rewardService;
    private UUID customerId;
    private UUID redemptionId;
    private RewardAccount account;

    @BeforeEach
    void setUp() {
        rewardService = new RewardServiceImpl(
                rewardAccountRepository, rewardLedgerRepository, rewardCacheService,
                new RewardMapper(), userRepository, auditService
        );

        customerId = UUID.randomUUID();
        redemptionId = UUID.randomUUID();
        account = new RewardAccount(customerId);
        account.setId(UUID.randomUUID());
        account.setAvailableBalance(BigDecimal.ZERO);
        account.setLifetimeEarned(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Simulate 10 concurrent reward credit requests for the same redemption: exactly one credit must be applied")
    void testConcurrentRewardCredit_IdempotentSingleBalanceIncrease() throws Exception {
        int threadCount = 10;
        BigDecimal creditAmount = new BigDecimal("50.00");

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threadCount);

        AtomicReference<RewardLedgerEntry> savedEntryRef = new AtomicReference<>(null);
        AtomicInteger actualSaves = new AtomicInteger(0);

        when(rewardAccountRepository.findByCustomerIdForUpdate(customerId)).thenReturn(Optional.of(account));
        when(rewardAccountRepository.save(any(RewardAccount.class))).thenAnswer(inv -> inv.getArgument(0));

        // Emulate DB unique constraint on (redemption_id, type)
        when(rewardLedgerRepository.save(any(RewardLedgerEntry.class))).thenAnswer(inv -> {
            synchronized (savedEntryRef) {
                if (savedEntryRef.get() != null) {
                    throw new DataIntegrityViolationException("duplicate key value violates unique constraint uq_reward_ledger_redemption_type");
                }
                RewardLedgerEntry entry = inv.getArgument(0);
                entry.setId(UUID.randomUUID());
                savedEntryRef.set(entry);
                actualSaves.incrementAndGet();
                return entry;
            }
        });

        when(rewardLedgerRepository.findByRedemptionIdAndType(redemptionId, RewardLedgerType.CREDIT))
                .thenAnswer(inv -> Optional.ofNullable(savedEntryRef.get()));

        AtomicInteger totalResponses = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    RewardLedgerItemResponse res = rewardService.creditRedemptionReward(
                            customerId, redemptionId, UUID.randomUUID(), creditAmount, "Concurrent redemption reward"
                    );
                    if (res != null) {
                        totalResponses.incrementAndGet();
                    }
                } catch (Exception ex) {
                    // unexpected error
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        finishLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertEquals(threadCount, totalResponses.get(), "All 10 calls should complete successfully (1 credit + 9 idempotent replays)");
        assertEquals(1, actualSaves.get(), "Exactly one ledger entry should be saved in DB");
        assertNotNull(savedEntryRef.get());
        assertEquals(0, creditAmount.compareTo(account.getAvailableBalance()), "Customer balance must be credited exactly once (50.00, not 500.00)");
    }
}
