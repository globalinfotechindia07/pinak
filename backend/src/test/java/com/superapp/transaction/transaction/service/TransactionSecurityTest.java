package com.superapp.transaction.transaction.service;

import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import com.superapp.transaction.transaction.entity.Transaction;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import com.superapp.transaction.transaction.mapper.TransactionMapper;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionSecurityTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private MerchantRepository merchantRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private OfferRepository offerRepository;
    @Mock private AuditService auditService;
    @Spy private TransactionMapper transactionMapper = new TransactionMapper();

    @InjectMocks private TransactionServiceImpl transactionService;

    private UUID customerAId;
    private UUID customerBId;
    private UUID merchantAOwnerId;
    private UUID merchantBOwnerId;
    private UUID merchantAId;
    private UUID merchantBId;
    private UUID storeAId;
    private UUID storeBId;
    private UUID txAId;
    private Transaction txA;

    @BeforeEach
    void setUp() {
        customerAId = UUID.randomUUID();
        customerBId = UUID.randomUUID();
        merchantAOwnerId = UUID.randomUUID();
        merchantBOwnerId = UUID.randomUUID();
        merchantAId = UUID.randomUUID();
        merchantBId = UUID.randomUUID();
        storeAId = UUID.randomUUID();
        storeBId = UUID.randomUUID();
        txAId = UUID.randomUUID();

        txA = new Transaction();
        txA.setId(txAId);
        txA.setCustomerId(customerAId);
        txA.setMerchantId(merchantAId);
        txA.setStoreId(storeAId);
        txA.setGrossAmount(new BigDecimal("100.00"));
        txA.setDiscountAmount(new BigDecimal("10.00"));
        txA.setPayableAmount(new BigDecimal("90.00"));
        txA.setCurrency("INR");
        txA.setStatus(TransactionStatus.SUCCESS);
    }

    @Test
    @DisplayName("IDOR Prevention: Customer B cannot retrieve Customer A's transaction detail")
    void testCustomerCannotAccessOtherCustomerTransaction() {
        when(transactionRepository.findById(txAId)).thenReturn(Optional.of(txA));

        assertThatThrownBy(() -> transactionService.getCustomerTransactionById(txAId, customerBId))
                .isInstanceOf(AppException.class)
                .satisfies(e -> {
                    AppException ex = (AppException) e;
                    org.assertj.core.api.Assertions.assertThat(ex.getErrorCode()).isEqualTo(ApiError.TRANSACTION_ACCESS_DENIED);
                    org.assertj.core.api.Assertions.assertThat(ex.getHttpStatus()).isEqualTo(403);
                });
    }

    @Test
    @DisplayName("BOLA Prevention: Merchant B cannot retrieve Merchant A's transaction detail")
    void testMerchantCannotAccessOtherMerchantTransaction() {
        Merchant merchantB = new Merchant();
        merchantB.setId(merchantBId);
        merchantB.setOwnerUserId(merchantBOwnerId);

        when(transactionRepository.findById(txAId)).thenReturn(Optional.of(txA));
        when(merchantRepository.findByOwnerUserId(merchantBOwnerId)).thenReturn(Optional.of(merchantB));

        assertThatThrownBy(() -> transactionService.getMerchantTransactionById(txAId, merchantBOwnerId))
                .isInstanceOf(AppException.class)
                .satisfies(e -> {
                    AppException ex = (AppException) e;
                    org.assertj.core.api.Assertions.assertThat(ex.getErrorCode()).isEqualTo(ApiError.TRANSACTION_ACCESS_DENIED);
                    org.assertj.core.api.Assertions.assertThat(ex.getHttpStatus()).isEqualTo(403);
                });
    }

    @Test
    @DisplayName("BOLA Prevention: Merchant B cannot filter by Store A belonging to Merchant A")
    void testMerchantCannotFilterByUnownedStore() {
        Merchant merchantB = new Merchant();
        merchantB.setId(merchantBId);
        merchantB.setOwnerUserId(merchantBOwnerId);

        Store storeA = new Store();
        storeA.setId(storeAId);
        storeA.setMerchantId(merchantAId); // Belongs to Merchant A!

        when(merchantRepository.findByOwnerUserId(merchantBOwnerId)).thenReturn(Optional.of(merchantB));
        when(storeRepository.findById(storeAId)).thenReturn(Optional.of(storeA));

        assertThatThrownBy(() -> transactionService.getMerchantTransactions(
                merchantBOwnerId, storeAId, null, null, null, null, PageRequest.of(0, 20)))
                .isInstanceOf(AppException.class)
                .satisfies(e -> {
                    AppException ex = (AppException) e;
                    org.assertj.core.api.Assertions.assertThat(ex.getErrorCode()).isEqualTo(ApiError.STORE_ACCESS_DENIED);
                    org.assertj.core.api.Assertions.assertThat(ex.getHttpStatus()).isEqualTo(403);
                });
    }
}
