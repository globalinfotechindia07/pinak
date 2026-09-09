package com.superapp.merchant.dto;

import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.KycStatus;
import com.superapp.merchant.entity.Merchant;

import java.time.Instant;
import java.util.UUID;

public record MerchantResponse(
        UUID id,
        UUID ownerUserId,
        String businessName,
        UUID categoryId,
        String categoryName,
        KycStatus kycStatus,
        ApprovalStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static MerchantResponse fromEntity(Merchant merchant, String categoryName) {
        if (merchant == null) return null;
        return new MerchantResponse(
                merchant.getId(),
                merchant.getOwnerUserId(),
                merchant.getBusinessName(),
                merchant.getCategoryId(),
                categoryName,
                merchant.getKycStatus(),
                merchant.getStatus(),
                merchant.getCreatedAt(),
                merchant.getUpdatedAt()
        );
    }
}
