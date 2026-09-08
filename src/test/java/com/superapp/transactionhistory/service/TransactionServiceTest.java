package com.superapp.transactionhistory.service;

import com.superapp.transactionhistory.dto.TransactionResponse;
import com.superapp.transactionhistory.entity.Transaction;
import com.superapp.transactionhistory.entity.TransactionStatus;
import com.superapp.transactionhistory.entity.TransactionType;
import com.superapp.transactionhistory.mapper.TransactionMapper;
import com.superapp.transactionhistory.repository.TransactionRepository;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock TransactionRepository transactionRepository;
    @Spy TransactionMapper transactionMapper = new TransactionMapper();

    @InjectMocks TransactionServiceImpl transactionService;

    private UUID customerId;
    private UUID merchantId;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        merchantId = UUID.randomUUID();
    }

    @Test
    @DisplayName("recordTransaction persists transaction with reference")
    void recordTransaction_success() {
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> {
            Transaction tx = i.getArgument(0);
            tx.setId(UUID.randomUUID());
            return tx;
        });

        Transaction tx = transactionService.recordTransaction(
                "TXN_REF123", UUID.randomUUID(), customerId, merchantId, null,
                new BigDecimal("250.00"), "INR", TransactionType.PAYMENT, TransactionStatus.SUCCESS, "Order paid"
        );

        assertThat(tx).isNotNull();
        assertThat(tx.getTransactionReference()).isEqualTo("TXN_REF123");
        assertThat(tx.getAmount()).isEqualByComparingTo("250.00");
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    @DisplayName("getCustomerTransactions returns paginated list")
    void getCustomerTransactions_success() {
        Transaction tx = new Transaction("TXN_REF123", UUID.randomUUID(), customerId, merchantId, null,
                new BigDecimal("250.00"), "INR", TransactionType.PAYMENT, TransactionStatus.SUCCESS, "Order paid");
        tx.setId(UUID.randomUUID());

        when(transactionRepository.findByCustomerId(eq(customerId), any()))
                .thenReturn(new PageImpl<>(List.of(tx)));

        Page<TransactionResponse> result = transactionService.getCustomerTransactions(customerId, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).transactionReference()).isEqualTo("TXN_REF123");
    }
}
