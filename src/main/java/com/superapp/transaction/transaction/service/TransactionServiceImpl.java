package com.superapp.transaction.transaction.service;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import com.superapp.transaction.transaction.dto.TransactionResponse;
import com.superapp.transaction.transaction.entity.Transaction;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import com.superapp.transaction.transaction.mapper.TransactionMapper;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final MerchantRepository merchantRepository;
    private final StoreRepository storeRepository;
    private final OfferRepository offerRepository;

    public TransactionServiceImpl(
            TransactionRepository transactionRepository,
            TransactionMapper transactionMapper,
            MerchantRepository merchantRepository,
            StoreRepository storeRepository,
            OfferRepository offerRepository) {
        this.transactionRepository = transactionRepository;
        this.transactionMapper = transactionMapper;
        this.merchantRepository = merchantRepository;
        this.storeRepository = storeRepository;
        this.offerRepository = offerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getCustomerTransactions(
            UUID customerId,
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable) {

        Page<Transaction> page = transactionRepository.findCustomerTransactionsFiltered(
                customerId, status, fromDate, toDate, pageable);

        return enrichTransactions(page, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(UUID transactionId, UUID authenticatedUserId, boolean isAdmin) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException("Transaction not found", ApiError.TRANSACTION_NOT_FOUND, 404));

        if (!isAdmin) {
            boolean isOwnerCustomer = transaction.getCustomerId().equals(authenticatedUserId);
            boolean isStoreOwner = false;

            Optional<Merchant> merchantOpt = merchantRepository.findByOwnerUserId(authenticatedUserId);
            if (merchantOpt.isPresent()) {
                Merchant merchant = merchantOpt.get();
                if (transaction.getMerchantId().equals(merchant.getId())) {
                    isStoreOwner = true;
                }
            }

            if (!isOwnerCustomer && !isStoreOwner) {
                throw new AppException("You do not have permission to access this transaction",
                        ApiError.TRANSACTION_ACCESS_DENIED, 403);
            }
        }

        Merchant merchant = transaction.getMerchantId() != null ?
                merchantRepository.findById(transaction.getMerchantId()).orElse(null) : null;
        Store store = transaction.getStoreId() != null ?
                storeRepository.findById(transaction.getStoreId()).orElse(null) : null;
        Offer offer = transaction.getOfferId() != null ?
                offerRepository.findById(transaction.getOfferId()).orElse(null) : null;

        return transactionMapper.toResponse(transaction, merchant, store, offer);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getMerchantTransactions(
            UUID merchantOwnerUserId,
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable) {

        Merchant merchant = merchantRepository.findByOwnerUserId(merchantOwnerUserId)
                .orElseThrow(() -> new AppException("Merchant account not found for user",
                        ApiError.MERCHANT_NOT_FOUND, 404));

        List<Store> stores = storeRepository.findByMerchantId(merchant.getId());
        if (stores.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        List<UUID> storeIds = stores.stream().map(Store::getId).toList();
        Page<Transaction> page = transactionRepository.findMerchantTransactionsFiltered(
                storeIds, status, fromDate, toDate, pageable);

        return enrichTransactions(page, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getAllTransactions(
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable) {

        Page<Transaction> page = transactionRepository.findAllFiltered(status, fromDate, toDate, pageable);
        return enrichTransactions(page, pageable);
    }

    private Page<TransactionResponse> enrichTransactions(Page<Transaction> page, Pageable pageable) {
        if (page.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        // Batch load merchants, stores, offers to avoid N+1 queries
        Set<UUID> merchantIds = page.getContent().stream()
                .map(Transaction::getMerchantId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<UUID> storeIds = page.getContent().stream()
                .map(Transaction::getStoreId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<UUID> offerIds = page.getContent().stream()
                .map(Transaction::getOfferId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, Merchant> merchantMap = merchantRepository.findAllById(merchantIds).stream()
                .collect(Collectors.toMap(Merchant::getId, m -> m));

        Map<UUID, Store> storeMap = storeRepository.findAllById(storeIds).stream()
                .collect(Collectors.toMap(Store::getId, s -> s));

        Map<UUID, Offer> offerMap = offerRepository.findAllById(offerIds).stream()
                .collect(Collectors.toMap(Offer::getId, o -> o));

        List<TransactionResponse> responses = page.getContent().stream()
                .map(tx -> transactionMapper.toResponse(
                        tx,
                        merchantMap.get(tx.getMerchantId()),
                        storeMap.get(tx.getStoreId()),
                        offerMap.get(tx.getOfferId())
                ))
                .toList();

        return new PageImpl<>(responses, pageable, page.getTotalElements());
    }
}
