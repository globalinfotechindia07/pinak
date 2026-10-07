package com.superapp.transaction.transaction.service;

import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import com.superapp.transaction.transaction.dto.TransactionDetailResponse;
import com.superapp.transaction.transaction.dto.TransactionListItemResponse;
import com.superapp.transaction.transaction.dto.TransactionResponse;
import com.superapp.transaction.transaction.entity.Transaction;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import com.superapp.transaction.transaction.mapper.TransactionMapper;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.Instant;
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
class TransactionServiceTest {

    @Mock private TransactionRepository transactionRepository;
    @Spy private TransactionMapper transactionMapper = new TransactionMapper();
    @Mock private MerchantRepository merchantRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private OfferRepository offerRepository;
    @Mock private AuditService auditService;

    @InjectMocks private TransactionServiceImpl transactionService;

    private UUID customerId;
    private UUID merchantId;
    private UUID storeId;
    private UUID txId;
    private Transaction transaction;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        merchantId = UUID.randomUUID();
        storeId = UUID.randomUUID();
        txId = UUID.randomUUID();

        transaction = new Transaction();
        transaction.setId(txId);
        transaction.setTransactionReference("TX-REF-100");
        transaction.setCustomerId(customerId);
        transaction.setMerchantId(merchantId);
        transaction.setStoreId(storeId);
        transaction.setGrossAmount(new BigDecimal("5000.00"));
        transaction.setDiscountAmount(new BigDecimal("500.00"));
        transaction.setPayableAmount(new BigDecimal("4500.00"));
        transaction.setCurrency("INR");
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setCreatedAt(Instant.now());
        transaction.setUpdatedAt(Instant.now());
    }

    @Test
    @DisplayName("Customer can retrieve their own transaction by ID")
    void testGetTransactionByIdOwnerSuccess() {
        when(transactionRepository.findById(txId)).thenReturn(Optional.of(transaction));

        TransactionResponse response = transactionService.getTransactionById(txId, customerId, false);

        assertThat(response).isNotNull();
        assertThat(response.transactionId()).isEqualTo(txId);
        assertThat(response.payableAmount()).isEqualByComparingTo("4500.00");
    }

    @Test
    @DisplayName("Customer cannot retrieve transaction of another customer")
    void testGetTransactionByIdOtherCustomerForbidden() {
        UUID otherCustomerId = UUID.randomUUID();
        when(transactionRepository.findById(txId)).thenReturn(Optional.of(transaction));
        when(merchantRepository.findByOwnerUserId(otherCustomerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.getTransactionById(txId, otherCustomerId, false))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.TRANSACTION_ACCESS_DENIED);
    }

    @Test
    @DisplayName("Customer can retrieve list of their transactions")
    void testGetCustomerTransactionsSuccess() {
        Page<Transaction> txPage = new PageImpl<>(List.of(transaction));
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(txPage);
        when(merchantRepository.findAllById(any())).thenReturn(List.of());
        when(storeRepository.findAllById(any())).thenReturn(List.of());

        Page<TransactionListItemResponse> result = transactionService.getCustomerTransactions(
                customerId, TransactionStatus.SUCCESS, null, null, PageRequest.of(0, 20));

        assertThat(result).isNotEmpty();
        assertThat(result.getContent().get(0).id()).isEqualTo(txId);
        assertThat(result.getContent().get(0).transactionReference()).isEqualTo("TX-REF-100");
    }

    @Test
    @DisplayName("Customer gets detailed response for their own transaction")
    void testGetCustomerTransactionByIdSuccess() {
        when(transactionRepository.findById(txId)).thenReturn(Optional.of(transaction));

        TransactionDetailResponse response = transactionService.getCustomerTransactionById(txId, customerId);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(txId);
        assertThat(response.transactionReference()).isEqualTo("TX-REF-100");
        assertThat(response.payableAmount()).isEqualByComparingTo("4500.00");
    }

    @Test
    @DisplayName("Merchant can retrieve transactions belonging to their own stores")
    void testGetMerchantTransactionsSuccess() {
        UUID merchantOwnerId = UUID.randomUUID();
        Merchant merchant = new Merchant();
        merchant.setId(merchantId);
        merchant.setOwnerUserId(merchantOwnerId);

        Store store = new Store();
        store.setId(storeId);
        store.setName("Nagpur Store");
        store.setMerchantId(merchantId);

        when(merchantRepository.findByOwnerUserId(merchantOwnerId)).thenReturn(Optional.of(merchant));
        when(storeRepository.findByMerchantId(merchantId)).thenReturn(List.of(store));

        Page<Transaction> txPage = new PageImpl<>(List.of(transaction));
        when(transactionRepository.findMerchantTransactionsFiltered(eq(List.of(storeId)), any(), any(), any(), any()))
                .thenReturn(txPage);
        when(merchantRepository.findAllById(any())).thenReturn(List.of(merchant));
        when(storeRepository.findAllById(any())).thenReturn(List.of(store));
        when(offerRepository.findAllById(any())).thenReturn(List.of());

        Page<TransactionResponse> result = transactionService.getMerchantTransactions(
                merchantOwnerId, null, null, null, PageRequest.of(0, 20));

        assertThat(result).isNotEmpty();
        assertThat(result.getContent().get(0).transactionId()).isEqualTo(txId);
    }

    @Test
    @DisplayName("Admin can retrieve full transaction details by ID with audit log")
    void testGetAdminTransactionByIdSuccess() {
        UUID adminId = UUID.randomUUID();
        when(transactionRepository.findById(txId)).thenReturn(Optional.of(transaction));

        TransactionDetailResponse response = transactionService.getAdminTransactionById(txId, adminId, "req-1");

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(txId);
    }

    @Test
    @DisplayName("Sort allowlist: invalid sort parameter defaults to createdAt DESC")
    void testSortAllowlistFallback() {
        Page<Transaction> txPage = new PageImpl<>(List.of(transaction));
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(transactionRepository.findAll(any(Specification.class), pageableCaptor.capture())).thenReturn(txPage);
        when(merchantRepository.findAllById(any())).thenReturn(List.of());
        when(storeRepository.findAllById(any())).thenReturn(List.of());

        // Attempting to sort by 'maliciousColumn; drop table'
        Pageable unsafePageable = PageRequest.of(0, 20, Sort.by("passwordHash"));
        transactionService.getCustomerTransactions(customerId, null, null, null, unsafePageable);

        Pageable captured = pageableCaptor.getValue();
        assertThat(captured.getSort().getOrderFor("createdAt")).isNotNull();
        assertThat(captured.getSort().getOrderFor("createdAt").getDirection()).isEqualTo(Sort.Direction.DESC);
    }
}
