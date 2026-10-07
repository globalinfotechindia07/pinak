package com.superapp.transaction.redemption.mapper;

import com.superapp.transaction.redemption.dto.RedemptionHistoryResponse;
import com.superapp.transaction.redemption.dto.RedemptionOfferDto;
import com.superapp.transaction.redemption.dto.RedemptionResponse;
import com.superapp.transaction.redemption.dto.RedemptionStoreDto;
import com.superapp.transaction.redemption.entity.Redemption;
import org.springframework.stereotype.Component;

@Component
public class RedemptionMapper {

    public RedemptionResponse toResponse(Redemption r) {
        if (r == null) return null;
        return new RedemptionResponse(
                r.getId(),
                r.getTransactionId(),
                r.getPaymentId(),
                r.getOfferId(),
                r.getStoreId(),
                r.getStatus(),
                r.getRedeemedAmount(),
                r.getDiscountAmount(),
                r.getRewardAmount(),
                r.getRedeemedAt()
        );
    }

    public RedemptionHistoryResponse toHistoryResponse(Redemption r, String offerTitle, String storeName) {
        if (r == null) return null;
        return new RedemptionHistoryResponse(
                r.getId(),
                r.getTransactionId(),
                r.getPaymentId(),
                new RedemptionOfferDto(r.getOfferId(), offerTitle),
                new RedemptionStoreDto(r.getStoreId(), storeName),
                r.getRedeemedAmount(),
                r.getDiscountAmount(),
                r.getRewardAmount(),
                r.getStatus(),
                r.getRedeemedAt()
        );
    }
}
