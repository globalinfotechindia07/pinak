package com.superapp.transactionhistory.service;

import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.transactionhistory.dto.TransactionResponse;
import com.superapp.transactionhistory.entity.Transaction;
import com.superapp.transactionhistory.entity.TransactionStatus;
import com.superapp.transactionhistory.entity.TransactionType;
import com.superapp.transactionhistory.mapper.TransactionMapper;
import com.superapp.transactionhistory.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class TransactionServiceImpl implements TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionServiceImpl.class);

    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;

    public TransactionServiceImpl(TransactionRepository transactionRepository, TransactionMapper transactionMapper) {
        this.transactionRepository = transactionRepository;
        this.transactionMapper = transactionMapper;
    }

    @Override
    @Transactional
    public Transaction recordTransaction(
            String reference,
            UUID paymentId,
            UUID customerId,
            UUID merchantId,
            UUID storeId,
            BigDecimal amount,
            String currency,
            TransactionType type,
            TransactionStatus status,
            String description
    ) {
        String txRef = (reference != null && !reference.isBlank())
                ? reference
                : "TXN_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        Transaction transaction = new Transaction(
                txRef, paymentId, customerId, merchantId, storeId,
                amount, currency, type, status, description
        );

        Transaction saved = transactionRepository.save(transaction);
        log.info("Recorded transaction id={} ref={} type={} amount={}",
                saved.getId(), saved.getTransactionReference(), saved.getType(), saved.getAmount());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(UUID id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        return transactionMapper.toResponse(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getTransactionByReference(String reference) {
        Transaction transaction = transactionRepository.findByTransactionReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with reference: " + reference));
        return transactionMapper.toResponse(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getCustomerTransactions(UUID customerId, Pageable pageable) {
        return transactionRepository.findByCustomerId(customerId, pageable)
                .map(transactionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getMerchantTransactions(UUID merchantId, Pageable pageable) {
        return transactionRepository.findByMerchantId(merchantId, pageable)
                .map(transactionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable)
                .map(transactionMapper::toResponse);
    }
}
