package com.superapp.transaction.reward;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.transaction.reward.dto.RewardLedgerItemResponse;
import com.superapp.transaction.reward.entity.RewardLedgerEntry;
import com.superapp.transaction.reward.enums.RewardLedgerStatus;
import com.superapp.transaction.reward.enums.RewardLedgerType;
import com.superapp.transaction.reward.mapper.RewardMapper;
import com.superapp.transaction.reward.repository.RewardAccountRepository;
import com.superapp.transaction.reward.repository.RewardLedgerRepository;
import com.superapp.transaction.reward.service.RewardCacheService;
import com.superapp.transaction.reward.service.RewardServiceImpl;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RewardSecurityTest {

    @Mock private RewardAccountRepository rewardAccountRepository;
    @Mock private RewardLedgerRepository rewardLedgerRepository;
    @Mock private RewardCacheService rewardCacheService;
    @Spy private RewardMapper rewardMapper = new RewardMapper();

    @InjectMocks
    private RewardServiceImpl rewardService;

    private UUID customerA;
    private UUID customerB;
    private UUID entryId;
    private RewardLedgerEntry entryA;

    @BeforeEach
    void setUp() {
        customerA = UUID.randomUUID();
        customerB = UUID.randomUUID();
        entryId = UUID.randomUUID();

        entryA = new RewardLedgerEntry();
        entryA.setId(entryId);
        entryA.setCustomerId(customerA);
        entryA.setType(RewardLedgerType.CREDIT);
        entryA.setAmount(BigDecimal.valueOf(50.00));
        entryA.setStatus(RewardLedgerStatus.POSTED);
    }

    @Test
    @DisplayName("Security: Customer B attempting to access Customer A's ledger entry must be rejected with 403 Forbidden")
    void testCustomerB_AccessCustomerAEntry_Forbidden() {
        when(rewardLedgerRepository.findById(entryId)).thenReturn(Optional.of(entryA));

        AppException ex = assertThrows(AppException.class,
                () -> rewardService.getLedgerEntryById(entryId, customerB, false));

        assertEquals(ApiError.REWARD_ACCESS_DENIED, ex.getErrorCode());
        assertEquals(403, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Security: Customer A accessing their own ledger entry must succeed")
    void testCustomerA_AccessOwnEntry_Allowed() {
        when(rewardLedgerRepository.findById(entryId)).thenReturn(Optional.of(entryA));

        RewardLedgerItemResponse response = rewardService.getLedgerEntryById(entryId, customerA, false);
        assertNotNull(response);
        assertEquals(entryId, response.id());
    }

    @Test
    @DisplayName("Security: Admin accessing any customer's ledger entry must succeed")
    void testAdmin_AccessAnyCustomerEntry_Allowed() {
        when(rewardLedgerRepository.findById(entryId)).thenReturn(Optional.of(entryA));

        RewardLedgerItemResponse response = rewardService.getLedgerEntryById(entryId, UUID.randomUUID(), true);
        assertNotNull(response);
        assertEquals(entryId, response.id());
    }
}
