package com.superapp.offer.mapper;

import com.superapp.discovery.dto.OfferResponse;
import com.superapp.merchant.entity.Merchant;
import com.superapp.offer.dto.CustomerOfferDetailResponse;
import com.superapp.offer.dto.MerchantOfferResponse;
import com.superapp.offer.dto.MerchantSummaryRef;
import com.superapp.offer.dto.StoreSummaryRef;
import com.superapp.offer.entity.Offer;
import com.superapp.store.entity.Store;
import org.springframework.stereotype.Component;

@Component
public class OfferMapper {

    public MerchantOfferResponse toMerchantResponse(Offer offer, String storeName) {
        if (offer == null) return null;

        return new MerchantOfferResponse(
                offer.getId().toString(),
                offer.getStoreId() != null ? offer.getStoreId().toString() : null,
                storeName,
                offer.getMerchantId().toString(),
                offer.getCategoryId() != null ? offer.getCategoryId().toString() : null,
                offer.getTitle(),
                offer.getDescription(),
                offer.getType() != null ? offer.getType().name() : null,
                offer.getValue(),
                offer.getMinTransactionAmount(),
                offer.getMaxDiscountAmount(),
                offer.getUsageLimit(),
                offer.getPerCustomerLimit(),
                offer.getValidFrom(),
                offer.getValidTo(),
                offer.getStatus() != null ? offer.getStatus().name() : null,
                offer.getApprovalStatus() != null ? offer.getApprovalStatus().name() : null,
                offer.getRejectionReason(),
                offer.getApprovedAt(),
                offer.getCreatedAt(),
                offer.getUpdatedAt()
        );
    }

    public CustomerOfferDetailResponse toCustomerDetailResponse(Offer offer, Store store, Merchant merchant) {
        if (offer == null) return null;

        StoreSummaryRef storeRef = store != null
                ? new StoreSummaryRef(store.getId().toString(), store.getStoreName())
                : (offer.getStoreId() != null ? new StoreSummaryRef(offer.getStoreId().toString(), null) : null);

        MerchantSummaryRef merchantRef = merchant != null
                ? new MerchantSummaryRef(merchant.getId().toString(), merchant.getBusinessName())
                : new MerchantSummaryRef(offer.getMerchantId().toString(), null);

        return new CustomerOfferDetailResponse(
                offer.getId().toString(),
                storeRef,
                merchantRef,
                offer.getTitle(),
                offer.getDescription(),
                offer.getType() != null ? offer.getType().name() : null,
                offer.getValue(),
                offer.getMinTransactionAmount(),
                offer.getMaxDiscountAmount(),
                offer.getValidFrom(),
                offer.getValidTo(),
                offer.getStatus() != null ? offer.getStatus().name() : null
        );
    }

    public OfferResponse toDiscoveryOfferResponse(Offer offer) {
        if (offer == null) return null;
        return new OfferResponse(
                offer.getId().toString(),
                offer.getTitle(),
                offer.getDescription(),
                offer.getType() != null ? offer.getType().name() : null,
                offer.getValue(),
                offer.getValidFrom(),
                offer.getValidTo(),
                offer.getStatus() != null ? offer.getStatus().name() : null
        );
    }
}
