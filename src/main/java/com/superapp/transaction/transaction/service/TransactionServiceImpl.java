package com.superapp.transaction.transaction.service;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.entity.Offer;
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
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TransactionServiceImpl implements TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionServiceImpl.class);

    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final MerchantRepository merchantRepository;
    private final StoreRepository storeRepository;
    private final OfferRepository offerRepository;
    private final AuditService auditService;

    @Autowired
    public TransactionServiceImpl(
            TransactionRepository transactionRepository,
            TransactionMapper transactionMapper,
            MerchantRepository merchantRepository,
            StoreRepository storeRepository,
            OfferRepository offerRepository,
            @Autowired(required = false) AuditService auditService) {
        this.transactionRepository = transactionRepository;
        this.transactionMapper = transactionMapper;
        this.merchantRepository = merchantRepository;
        this.storeRepository = storeRepository;
        this.offerRepository = offerRepository;
        this.auditService = auditService;
    }

    public TransactionServiceImpl(
            TransactionRepository transactionRepository,
            TransactionMapper transactionMapper,
            MerchantRepository merchantRepository,
            StoreRepository storeRepository,
            OfferRepository offerRepository) {
        this(transactionRepository, transactionMapper, merchantRepository, storeRepository, offerRepository, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionListItemResponse> getCustomerTransactions(
            UUID customerId,
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable) {

        Pageable effectivePageable = validateAndNormalizePageable(pageable);

        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("customerId"), customerId));
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Transaction> page = transactionRepository.findAll(spec, effectivePageable);
        return enrichListItems(page, effectivePageable);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionDetailResponse getCustomerTransactionById(UUID transactionId, UUID customerId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException("Transaction not found", ApiError.TRANSACTION_NOT_FOUND, 404));

        if (!Objects.equals(transaction.getCustomerId(), customerId)) {
            throw new AppException("You do not have permission to access this transaction",
                    ApiError.TRANSACTION_ACCESS_DENIED, 403);
        }

        return loadTransactionDetails(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionListItemResponse> getMerchantTransactions(
            UUID merchantOwnerUserId,
            UUID storeId,
            UUID offerId,
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable) {

        Merchant merchant = merchantRepository.findByOwnerUserId(merchantOwnerUserId)
                .orElseThrow(() -> new AppException("Merchant account not found for user",
                        ApiError.MERCHANT_NOT_FOUND, 404));

        if (storeId != null) {
            Store store = storeRepository.findById(storeId)
                    .orElseThrow(() -> new AppException("Store not found", ApiError.STORE_NOT_FOUND, 404));
            if (!store.getMerchantId().equals(merchant.getId())) {
                throw new AppException("Store does not belong to merchant account", ApiError.STORE_ACCESS_DENIED, 403);
            }
        }

        if (offerId != null) {
            Offer offer = offerRepository.findById(offerId)
                    .orElseThrow(() -> new AppException("Offer not found", ApiError.OFFER_NOT_FOUND, 404));
            if (!offer.getMerchantId().equals(merchant.getId())) {
                throw new AppException("Offer does not belong to merchant account", ApiError.OFFER_ACCESS_DENIED, 403);
            }
        }

        Pageable effectivePageable = validateAndNormalizePageable(pageable);

        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("merchantId"), merchant.getId()));
            if (storeId != null) {
                predicates.add(cb.equal(root.get("storeId"), storeId));
            }
            if (offerId != null) {
                predicates.add(cb.equal(root.get("offerId"), offerId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Transaction> page = transactionRepository.findAll(spec, effectivePageable);
        return enrichListItems(page, effectivePageable);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionDetailResponse getMerchantTransactionById(UUID transactionId, UUID merchantOwnerUserId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException("Transaction not found", ApiError.TRANSACTION_NOT_FOUND, 404));

        Merchant merchant = merchantRepository.findByOwnerUserId(merchantOwnerUserId)
                .orElseThrow(() -> new AppException("Merchant account not found for user",
                        ApiError.MERCHANT_NOT_FOUND, 404));

        if (!Objects.equals(transaction.getMerchantId(), merchant.getId())) {
            throw new AppException("You do not have permission to access this transaction",
                    ApiError.TRANSACTION_ACCESS_DENIED, 403);
        }

        return loadTransactionDetails(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionListItemResponse> getAdminTransactions(
            UUID customerId,
            UUID merchantId,
            UUID storeId,
            UUID offerId,
            UUID paymentId,
            UUID redemptionId,
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            String search,
            Pageable pageable,
            UUID adminUserId,
            String requestId) {

        Pageable effectivePageable = validateAndNormalizePageable(pageable);

        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (customerId != null) {
                predicates.add(cb.equal(root.get("customerId"), customerId));
            }
            if (merchantId != null) {
                predicates.add(cb.equal(root.get("merchantId"), merchantId));
            }
            if (storeId != null) {
                predicates.add(cb.equal(root.get("storeId"), storeId));
            }
            if (offerId != null) {
                predicates.add(cb.equal(root.get("offerId"), offerId));
            }
            if (paymentId != null) {
                predicates.add(cb.equal(root.get("paymentId"), paymentId));
            }
            if (redemptionId != null) {
                predicates.add(cb.equal(root.get("redemptionId"), redemptionId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate refMatch = cb.like(cb.lower(root.get("transactionReference")), pattern);
                Predicate provMatch = cb.like(cb.lower(root.get("providerTransactionId")), pattern);
                predicates.add(cb.or(refMatch, provMatch));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Transaction> page = transactionRepository.findAll(spec, effectivePageable);

        if (auditService != null && adminUserId != null) {
            try {
                auditService.record(AuditEventType.TRANSACTION_SEARCHED, adminUserId, null, null, requestId,
                        "Admin searched transactions: count=" + page.getTotalElements());
            } catch (Exception ex) {
                log.warn("Failed to audit admin transaction search: {}", ex.getMessage());
            }
        }

        return enrichListItems(page, effectivePageable);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionDetailResponse getAdminTransactionById(UUID transactionId, UUID adminUserId, String requestId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException("Transaction not found", ApiError.TRANSACTION_NOT_FOUND, 404));

        if (auditService != null && adminUserId != null) {
            try {
                auditService.record(AuditEventType.TRANSACTION_ACCESSED, adminUserId, null, null, requestId,
                        "Admin viewed transaction details: " + transactionId);
            } catch (Exception ex) {
                log.warn("Failed to audit admin transaction access: {}", ex.getMessage());
            }
        }

        return loadTransactionDetails(transaction);
    }

    // Backwards compatibility methods
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
    public Page<TransactionResponse> getAllTransactions(
            TransactionStatus status,
            Instant fromDate,
            Instant toDate,
            Pageable pageable) {
        Page<Transaction> page = transactionRepository.findAllFiltered(status, fromDate, toDate, pageable);
        return enrichLegacyTransactions(page, pageable);
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

        return enrichLegacyTransactions(page, pageable);
    }

    private Pageable validateAndNormalizePageable(Pageable pageable) {
        int pageNumber = Math.max(pageable.getPageNumber(), 0);
        int pageSize = Math.min(Math.max(pageable.getPageSize(), 1), 100);

        List<Sort.Order> allowedOrders = new ArrayList<>();
        if (pageable.getSort().isSorted()) {
            for (Sort.Order order : pageable.getSort()) {
                String property = order.getProperty();
                if ("createdAt".equalsIgnoreCase(property) ||
                    "payableAmount".equalsIgnoreCase(property) ||
                    "status".equalsIgnoreCase(property)) {
                    allowedOrders.add(new Sort.Order(order.getDirection(), property));
                }
            }
        }

        if (allowedOrders.isEmpty()) {
            allowedOrders.add(new Sort.Order(Sort.Direction.DESC, "createdAt"));
        }

        return PageRequest.of(pageNumber, pageSize, Sort.by(allowedOrders));
    }

    private TransactionDetailResponse loadTransactionDetails(Transaction transaction) {
        Merchant merchant = transaction.getMerchantId() != null ?
                merchantRepository.findById(transaction.getMerchantId()).orElse(null) : null;
        Store store = transaction.getStoreId() != null ?
                storeRepository.findById(transaction.getStoreId()).orElse(null) : null;
        Offer offer = transaction.getOfferId() != null ?
                offerRepository.findById(transaction.getOfferId()).orElse(null) : null;

        return transactionMapper.toDetailResponse(transaction, merchant, store, offer);
    }

    private Page<TransactionListItemResponse> enrichListItems(Page<Transaction> page, Pageable pageable) {
        if (page.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        Set<UUID> merchantIds = page.getContent().stream()
                .map(Transaction::getMerchantId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<UUID> storeIds = page.getContent().stream()
                .map(Transaction::getStoreId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, Merchant> merchantMap = merchantRepository.findAllById(merchantIds).stream()
                .collect(Collectors.toMap(Merchant::getId, m -> m));

        Map<UUID, Store> storeMap = storeRepository.findAllById(storeIds).stream()
                .collect(Collectors.toMap(Store::getId, s -> s));

        List<TransactionListItemResponse> items = page.getContent().stream()
                .map(tx -> transactionMapper.toListItemResponse(
                        tx,
                        merchantMap.get(tx.getMerchantId()),
                        storeMap.get(tx.getStoreId())
                ))
                .toList();

        return new PageImpl<>(items, pageable, page.getTotalElements());
    }

    private Page<TransactionResponse> enrichLegacyTransactions(Page<Transaction> page, Pageable pageable) {
        if (page.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

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
