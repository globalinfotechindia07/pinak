package com.superapp.transaction.transaction.mapper;

import com.superapp.merchant.entity.Merchant;
import com.superapp.offer.entity.Offer;
import com.superapp.store.entity.Store;
import com.superapp.transaction.transaction.dto.*;
import com.superapp.transaction.transaction.entity.Transaction;
import org.springframework.stereotype.Component;

@Component
public class TransactionMapper {

    public TransactionListItemResponse toListItemResponse(Transaction transaction, Merchant merchant, Store store) {
        if (transaction == null) {
            return null;
        }

        String merchantName = merchant != null ? merchant.getBusinessName() : null;
        String storeName = store != null ? store.getName() : null;

        return new TransactionListItemResponse(
                transaction.getId(),
                transaction.getTransactionReference(),
                transaction.getMerchantId(),
                merchantName,
                transaction.getStoreId(),
                storeName,
                transaction.getOfferId(),
                transaction.getGrossAmount(),
                transaction.getDiscountAmount(),
                transaction.getPayableAmount(),
                transaction.getCurrency(),
                transaction.getPaymentMethod(),
                transaction.getStatus(),
                transaction.getCreatedAt()
        );
    }

    public TransactionDetailResponse toDetailResponse(Transaction transaction, Merchant merchant, Store store, Offer offer) {
        if (transaction == null) {
            return null;
        }

        TransactionMerchantDto merchantDto = null;
        if (merchant != null) {
            merchantDto = new TransactionMerchantDto(merchant.getId(), merchant.getBusinessName());
        } else if (transaction.getMerchantId() != null) {
            merchantDto = new TransactionMerchantDto(transaction.getMerchantId(), null);
        }

        TransactionStoreDto storeDto = null;
        if (store != null) {
            storeDto = new TransactionStoreDto(store.getId(), store.getName());
        } else if (transaction.getStoreId() != null) {
            storeDto = new TransactionStoreDto(transaction.getStoreId(), null);
        }

        TransactionOfferDto offerDto = null;
        if (offer != null) {
            offerDto = new TransactionOfferDto(offer.getId(), offer.getTitle());
        } else if (transaction.getOfferId() != null) {
            offerDto = new TransactionOfferDto(transaction.getOfferId(), null);
        }

        return new TransactionDetailResponse(
                transaction.getId(),
                transaction.getTransactionReference(),
                merchantDto,
                storeDto,
                offerDto,
                transaction.getGrossAmount(),
                transaction.getDiscountAmount(),
                transaction.getPayableAmount(),
                transaction.getCurrency(),
                transaction.getPaymentMethod(),
                transaction.getStatus(),
                transaction.getPaymentId(),
                transaction.getRedemptionId(),
                transaction.getProviderTransactionId(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt()
        );
    }

    public TransactionResponse toResponse(Transaction transaction, Merchant merchant, Store store, Offer offer) {
        if (transaction == null) {
            return null;
        }

        TransactionMerchantDto merchantDto = null;
        if (merchant != null) {
            merchantDto = new TransactionMerchantDto(merchant.getId(), merchant.getBusinessName());
        } else if (transaction.getMerchantId() != null) {
            merchantDto = new TransactionMerchantDto(transaction.getMerchantId(), null);
        }

        TransactionStoreDto storeDto = null;
        if (store != null) {
            storeDto = new TransactionStoreDto(store.getId(), store.getName());
        } else if (transaction.getStoreId() != null) {
            storeDto = new TransactionStoreDto(transaction.getStoreId(), null);
        }

        TransactionOfferDto offerDto = null;
        if (offer != null) {
            offerDto = new TransactionOfferDto(offer.getId(), offer.getTitle());
        } else if (transaction.getOfferId() != null) {
            offerDto = new TransactionOfferDto(transaction.getOfferId(), null);
        }

        return new TransactionResponse(
                transaction.getId(),
                transaction.getPaymentId(),
                merchantDto,
                storeDto,
                offerDto,
                transaction.getGrossAmount(),
                transaction.getDiscountAmount(),
                transaction.getPayableAmount(),
                transaction.getCurrency(),
                transaction.getStatus(),
                transaction.getCreatedAt()
        );
    }
}
