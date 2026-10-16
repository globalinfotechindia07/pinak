package com.superapp.merchant.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.KycStatus;
import com.superapp.merchant.entity.Merchant;

import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MerchantResponse(
        String id,
        String ownerUserId,
        String businessName,
        String legalName,
        String description,
        String categoryId,
        String categoryName,
        String phone,
        String email,
        String website,
        String bankUpiId,
        String gstin,
        String pan,
        String status,
        String approvalStatus,
        String kycStatus,
        Instant createdAt,
        Instant updatedAt,
        String state,
        String district,
        String city,
        String pincode,
        String address
) {
    public static MerchantResponse fromEntity(Merchant merchant) {
        return fromEntity(merchant, null);
    }

    public static MerchantResponse fromEntity(Merchant merchant, String categoryName) {
        if (merchant == null) return null;
        return new MerchantResponse(
                merchant.getId() != null ? merchant.getId().toString() : null,
                merchant.getOwnerUserId() != null ? merchant.getOwnerUserId().toString() : null,
                merchant.getBusinessName(),
                merchant.getLegalName(),
                merchant.getDescription(),
                merchant.getCategoryId() != null ? merchant.getCategoryId().toString() : null,
                categoryName,
                merchant.getPhone(),
                merchant.getEmail(),
                merchant.getWebsite(),
                merchant.getBankUpiId(),
                merchant.getGstin(),
                merchant.getPan(),
                merchant.getStatus() != null ? merchant.getStatus().name() : null,
                merchant.getApprovalStatus() != null ? merchant.getApprovalStatus().name() : null,
                merchant.getKycStatus() != null ? merchant.getKycStatus().name() : null,
                merchant.getCreatedAt(),
                merchant.getUpdatedAt(),
                merchant.getState(),
                merchant.getDistrict(),
                merchant.getCity(),
                merchant.getPincode(),
                merchant.getAddress()
        );
    }

    // 18-arg backward-compatible constructor
    public MerchantResponse(String id, String ownerUserId, String businessName, String legalName,
                            String description, String categoryId, String categoryName, String phone,
                            String email, String website, String bankUpiId, String gstin,
                            String pan, String status, String approvalStatus, String kycStatus,
                            Instant createdAt, Instant updatedAt) {
        this(id, ownerUserId, businessName, legalName, description, categoryId, categoryName,
                phone, email, website, bankUpiId, gstin, pan, status, approvalStatus, kycStatus,
                createdAt, updatedAt, null, null, null, null, null);
    }

    // 9-arg backward-compatible constructor for existing tests
    public MerchantResponse(UUID id, UUID ownerUserId, String businessName, UUID categoryId,
                            String categoryName, KycStatus kycStatus, ApprovalStatus status,
                            Instant createdAt, Instant updatedAt) {
        this(
                id != null ? id.toString() : null,
                ownerUserId != null ? ownerUserId.toString() : null,
                businessName,
                null,
                null,
                categoryId != null ? categoryId.toString() : null,
                categoryName,
                null,
                null,
                null,
                null,
                null,
                null,
                status != null ? status.name() : "ACTIVE",
                status != null ? status.name() : "PENDING_APPROVAL",
                kycStatus != null ? kycStatus.name() : null,
                createdAt,
                updatedAt,
                null,
                null,
                null,
                null,
                null
        );
    }

    // 15-arg backward-compatible constructor for existing security tests
    public MerchantResponse(String id, String ownerUserId, String businessName, String categoryId,
                            String categoryName, String phone, String email, String website,
                            String bankUpiId, String gstin, String pan, String status,
                            String approvalStatus, Instant createdAt, Instant updatedAt) {
        this(
                id,
                ownerUserId,
                businessName,
                null,
                null,
                categoryId,
                categoryName,
                phone,
                email,
                website,
                bankUpiId,
                gstin,
                pan,
                status,
                approvalStatus,
                null,
                createdAt,
                updatedAt,
                null,
                null,
                null,
                null,
                null
        );
    }
}
