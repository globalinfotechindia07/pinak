package com.superapp.transaction.reward;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.transaction.reward.dto.AdminRewardAdjustmentRequest;
import com.superapp.transaction.reward.dto.AdminRewardAdjustmentResponse;
import com.superapp.transaction.reward.dto.RewardBalanceResponse;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RewardServiceTest {

    @Mock private RewardAccountRepository rewardAccountRepository;
    @Mock private RewardLedgerRepository rewardLedgerRepository;
    @Mock private RewardCacheService rewardCacheService;
    @Spy private RewardMapper rewardMapper = new RewardMapper();
    @Mock private UserRepository userRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private RewardServiceImpl rewardService;

    private UUID customerId;
    private RewardAccount account;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        account = new RewardAccount(customerId);
        account.setId(UUID.randomUUID());
        account.setAvailableBalance(new BigDecimal("100.00"));
        account.setLifetimeEarned(new BigDecimal("100.00"));
    }

    @Test
    @DisplayName("Should return cached reward balance if present in Redis")
    void testGetRewardBalance_CacheHit() {
        RewardBalanceResponse cached = new RewardBalanceResponse(
                new BigDecimal("250.00"), BigDecimal.ZERO, new BigDecimal("500.00"), new BigDecimal("250.00"), "INR");
        when(rewardCacheService.getAccount(customerId)).thenReturn(Optional.of(cached));

        RewardBalanceResponse response = rewardService.getRewardBalance(customerId);
        assertNotNull(response);
        assertEquals(0, new BigDecimal("250.00").compareTo(response.availableBalance()));
        verifyNoInteractions(rewardAccountRepository);
    }

    @Test
    @DisplayName("Should fetch from DB and cache in Redis on cache miss")
    void testGetRewardBalance_CacheMiss() {
        when(rewardCacheService.getAccount(customerId)).thenReturn(Optional.empty());
        when(rewardAccountRepository.findByCustomerId(customerId)).thenReturn(Optional.of(account));

        RewardBalanceResponse response = rewardService.getRewardBalance(customerId);
        assertNotNull(response);
        assertEquals(0, new BigDecimal("100.00").compareTo(response.availableBalance()));
        verify(rewardCacheService).putAccount(customerId, response);
    }

    @Test
    @DisplayName("Should credit reward after redemption and update balance atomically")
    void testCreditRedemptionReward_Success() {
        UUID redemptionId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();
        BigDecimal rewardAmount = new BigDecimal("50.00");

        when(rewardLedgerRepository.findByRedemptionIdAndType(redemptionId, RewardLedgerType.CREDIT))
                .thenReturn(Optional.empty());
        when(rewardAccountRepository.findByCustomerIdForUpdate(customerId))
                .thenReturn(Optional.of(account));
        when(rewardLedgerRepository.save(any(RewardLedgerEntry.class))).thenAnswer(inv -> {
            RewardLedgerEntry entry = inv.getArgument(0);
            if (entry.getId() == null) {
                entry.setId(UUID.randomUUID());
            }
            return entry;
        });

        RewardLedgerItemResponse response = rewardService.creditRedemptionReward(
                customerId, redemptionId, transactionId, rewardAmount, "Redemption reward");

        assertNotNull(response);
        assertEquals(RewardLedgerType.CREDIT, response.type());
        assertEquals(0, new BigDecimal("50.00").compareTo(response.amount()));
        assertEquals(0, new BigDecimal("150.00").compareTo(account.getAvailableBalance()));
        assertEquals(0, new BigDecimal("150.00").compareTo(account.getLifetimeEarned()));

        verify(rewardAccountRepository).save(account);
        verify(rewardCacheService).evictAccount(customerId);
        verify(auditService).record(eq(AuditEventType.REWARD_CREDITED), eq(customerId), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should be idempotent: duplicate credit call for same redemption returns existing entry")
    void testCreditRedemptionReward_Idempotent() {
        UUID redemptionId = UUID.randomUUID();
        RewardLedgerEntry existing = new RewardLedgerEntry();
        existing.setId(UUID.randomUUID());
        existing.setCustomerId(customerId);
        existing.setRedemptionId(redemptionId);
        existing.setType(RewardLedgerType.CREDIT);
        existing.setAmount(new BigDecimal("50.00"));
        existing.setStatus(RewardLedgerStatus.POSTED);

        when(rewardLedgerRepository.findByRedemptionIdAndType(redemptionId, RewardLedgerType.CREDIT))
                .thenReturn(Optional.of(existing));

        RewardLedgerItemResponse response = rewardService.creditRedemptionReward(
                customerId, redemptionId, UUID.randomUUID(), new BigDecimal("50.00"), "Duplicate credit");

        assertNotNull(response);
        assertEquals(existing.getId(), response.id());
        verify(rewardLedgerRepository, never()).save(any());
        verify(rewardAccountRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully reverse a posted reward entry")
    void testReverseReward_Success() {
        UUID entryId = UUID.randomUUID();
        RewardLedgerEntry original = new RewardLedgerEntry();
        original.setId(entryId);
        original.setCustomerId(customerId);
        original.setAmount(new BigDecimal("40.00"));
        original.setType(RewardLedgerType.CREDIT);
        original.setStatus(RewardLedgerStatus.POSTED);

        when(rewardLedgerRepository.findById(entryId)).thenReturn(Optional.of(original));
        when(rewardLedgerRepository.findByReferenceIdAndType("REVERSAL-" + entryId, RewardLedgerType.REVERSAL))
                .thenReturn(Optional.empty());
        when(rewardAccountRepository.findByCustomerIdForUpdate(customerId)).thenReturn(Optional.of(account));
        when(rewardLedgerRepository.save(any(RewardLedgerEntry.class))).thenAnswer(inv -> {
            RewardLedgerEntry entry = inv.getArgument(0);
            if (entry.getId() == null) {
                entry.setId(UUID.randomUUID());
            }
            return entry;
        });

        RewardLedgerItemResponse reversal = rewardService.reverseReward(
                entryId, "Customer refunded", "req-rev-1", UUID.randomUUID());

        assertNotNull(reversal);
        assertEquals(RewardLedgerType.REVERSAL, reversal.type());
        assertEquals(0, new BigDecimal("40.00").compareTo(reversal.amount()));
        assertEquals(RewardLedgerStatus.REVERSED, original.getStatus());
        assertEquals(0, new BigDecimal("60.00").compareTo(account.getAvailableBalance()));
        verify(rewardCacheService).evictAccount(customerId);
    }

    @Test
    @DisplayName("Should reject reversal if entry is already reversed")
    void testReverseReward_AlreadyReversed() {
        UUID entryId = UUID.randomUUID();
        RewardLedgerEntry original = new RewardLedgerEntry();
        original.setId(entryId);
        original.setStatus(RewardLedgerStatus.REVERSED);

        when(rewardLedgerRepository.findById(entryId)).thenReturn(Optional.of(original));

        AppException ex = assertThrows(AppException.class,
                () -> rewardService.reverseReward(entryId, "Reason", "req-rev-2", UUID.randomUUID()));
        assertEquals(ApiError.REWARD_ALREADY_REVERSED, ex.getErrorCode());
        assertEquals(409, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should reject reversal if customer balance would become negative")
    void testReverseReward_InsufficientBalance() {
        UUID entryId = UUID.randomUUID();
        RewardLedgerEntry original = new RewardLedgerEntry();
        original.setId(entryId);
        original.setCustomerId(customerId);
        original.setAmount(new BigDecimal("150.00")); // More than current 100.00
        original.setType(RewardLedgerType.CREDIT);
        original.setStatus(RewardLedgerStatus.POSTED);

        when(rewardLedgerRepository.findById(entryId)).thenReturn(Optional.of(original));
        when(rewardLedgerRepository.findByReferenceIdAndType("REVERSAL-" + entryId, RewardLedgerType.REVERSAL))
                .thenReturn(Optional.empty());
        when(rewardAccountRepository.findByCustomerIdForUpdate(customerId)).thenReturn(Optional.of(account));

        AppException ex = assertThrows(AppException.class,
                () -> rewardService.reverseReward(entryId, "Reason", "req-rev-3", UUID.randomUUID()));
        assertEquals(ApiError.INSUFFICIENT_REWARD_BALANCE, ex.getErrorCode());
        assertEquals(409, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should process admin reward adjustment successfully")
    void testAdjustReward_CreditSuccess() {
        AdminRewardAdjustmentRequest request = new AdminRewardAdjustmentRequest(
                customerId, new BigDecimal("30.00"), RewardLedgerType.CREDIT, "Bonus promotion");

        when(userRepository.existsById(customerId)).thenReturn(true);
        when(rewardLedgerRepository.findByReferenceIdAndType("ADJUST-key-1", RewardLedgerType.CREDIT))
                .thenReturn(Optional.empty());
        when(rewardAccountRepository.findByCustomerIdForUpdate(customerId)).thenReturn(Optional.of(account));
        when(rewardLedgerRepository.save(any(RewardLedgerEntry.class))).thenAnswer(inv -> {
            RewardLedgerEntry entry = inv.getArgument(0);
            if (entry.getId() == null) {
                entry.setId(UUID.randomUUID());
            }
            return entry;
        });

        AdminRewardAdjustmentResponse response = rewardService.adjustReward(
                request, "key-1", "req-adj-1", UUID.randomUUID());

        assertNotNull(response);
        assertEquals(0, new BigDecimal("30.00").compareTo(response.amount()));
        assertEquals(0, new BigDecimal("130.00").compareTo(account.getAvailableBalance()));
        verify(rewardCacheService).evictAccount(customerId);
    }

    @Test
    @DisplayName("Should reject admin debit adjustment if balance is insufficient")
    void testAdjustReward_DebitInsufficientBalance() {
        AdminRewardAdjustmentRequest request = new AdminRewardAdjustmentRequest(
                customerId, BigDecimal.valueOf(300.00), RewardLedgerType.DEBIT, "Correction");

        when(userRepository.existsById(customerId)).thenReturn(true);
        when(rewardLedgerRepository.findByReferenceIdAndType("ADJUST-key-2", RewardLedgerType.DEBIT))
                .thenReturn(Optional.empty());
        when(rewardAccountRepository.findByCustomerIdForUpdate(customerId)).thenReturn(Optional.of(account));

        AppException ex = assertThrows(AppException.class,
                () -> rewardService.adjustReward(request, "key-2", "req-adj-2", UUID.randomUUID()));
        assertEquals(ApiError.INSUFFICIENT_REWARD_BALANCE, ex.getErrorCode());
        assertEquals(409, ex.getHttpStatus());
    }
}
