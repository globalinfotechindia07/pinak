package com.superapp.user.service;

import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.repository.StoreRepository;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import com.superapp.user.dto.UserDTO;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardUnitTest {

    @Mock private UserRepository userRepository;
    @Mock private MerchantRepository merchantRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private OfferRepository offerRepository;
    @Mock private TransactionRepository transactionRepository;

    @InjectMocks private AdminDashboardServiceImpl dashboardService;

    @Test
    @DisplayName("getDashboardSummary returns accurate aggregated metrics using SQL counts")
    void getDashboardSummary_returnsAggregatedMetrics() {
        // Users
        when(userRepository.count()).thenReturn(1000L);
        when(userRepository.countByStatus(UserStatus.ACTIVE)).thenReturn(920L);
        when(userRepository.countByStatus(UserStatus.INACTIVE)).thenReturn(50L);

        // Merchants
        when(merchantRepository.count()).thenReturn(120L);
        when(merchantRepository.countByApprovalStatus(ApprovalStatus.PENDING_APPROVAL)).thenReturn(8L);
        when(merchantRepository.countByStatus(MerchantStatus.ACTIVE)).thenReturn(105L);
        when(merchantRepository.countByStatus(MerchantStatus.SUSPENDED)).thenReturn(7L);

        // Stores
        when(storeRepository.count()).thenReturn(350L);
        when(storeRepository.countByApprovalStatus(ApprovalStatus.PENDING_APPROVAL)).thenReturn(15L);
        when(storeRepository.countByStatus(StoreStatus.ACTIVE)).thenReturn(320L);

        // Offers
        when(offerRepository.count()).thenReturn(500L);
        when(offerRepository.countByApprovalStatus(OfferApprovalStatus.PENDING_APPROVAL)).thenReturn(25L);
        when(offerRepository.countByStatus(OfferStatus.ACTIVE)).thenReturn(400L);
        when(offerRepository.countByStatus(OfferStatus.EXPIRED)).thenReturn(50L);

        // Transactions
        when(transactionRepository.count()).thenReturn(50000L);
        when(transactionRepository.countByStatus(TransactionStatus.SUCCESS)).thenReturn(48000L);
        when(transactionRepository.countByStatus(TransactionStatus.PENDING)).thenReturn(200L);
        when(transactionRepository.countByStatus(TransactionStatus.FAILED)).thenReturn(1300L);
        when(transactionRepository.countByStatus(TransactionStatus.REFUNDED)).thenReturn(500L);

        UserDTO.AdminDashboardSummaryResponse summary = dashboardService.getDashboardSummary();

        assertThat(summary).isNotNull();
        assertThat(summary.users().total()).isEqualTo(1000L);
        assertThat(summary.users().active()).isEqualTo(920L);
        assertThat(summary.users().inactive()).isEqualTo(50L);

        assertThat(summary.merchants().total()).isEqualTo(120L);
        assertThat(summary.merchants().pendingApproval()).isEqualTo(8L);
        assertThat(summary.merchants().active()).isEqualTo(105L);
        assertThat(summary.merchants().suspended()).isEqualTo(7L);

        assertThat(summary.stores().total()).isEqualTo(350L);
        assertThat(summary.stores().pendingApproval()).isEqualTo(15L);
        assertThat(summary.stores().active()).isEqualTo(320L);

        assertThat(summary.offers().total()).isEqualTo(500L);
        assertThat(summary.offers().pendingApproval()).isEqualTo(25L);
        assertThat(summary.offers().active()).isEqualTo(400L);

        assertThat(summary.transactions().total()).isEqualTo(50000L);
        assertThat(summary.transactions().successful()).isEqualTo(48000L);
        assertThat(summary.transactions().pending()).isEqualTo(200L);
        assertThat(summary.transactions().failed()).isEqualTo(1300L);
        assertThat(summary.transactions().refunded()).isEqualTo(500L);

        assertThat(summary.timestamp()).isNotNull();
    }
}
