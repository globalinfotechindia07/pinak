package com.superapp.merchant.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.KycStatus;
import com.superapp.merchant.entity.Merchant;

import java.math.BigDecimal;
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
        String address,
        String bankName,
        String accountHolderName,
        String bankAccountNumber,
        String bankIfsc,
        BigDecimal commissionRate
) {
    public static MerchantResponse fromEntity(Merchant merchant) {
        return fromEntity(merchant, null, null);
    }

    public static MerchantResponse fromEntity(Merchant merchant, String categoryName) {
        return fromEntity(merchant, categoryName, null);
    }

    public static MerchantResponse fromEntity(Merchant merchant, String categoryName, com.superapp.wallet.entity.MerchantBankAccount bank) {
        if (merchant == null) return null;
        String bankUpiId = bank != null ? bank.getUpiVpa() : null;
        String bankName = bank != null ? bank.getBankName() : null;
        String accountHolderName = bank != null ? bank.getAccountHolderName() : null;
        String bankAccountNumber = null;
        if (bank != null) {
            if (bank.getAccountNumberEncrypted() != null && bank.getAccountNumberEncrypted().startsWith("ENC_AES256_")) {
                try {
                    String b64 = bank.getAccountNumberEncrypted().substring("ENC_AES256_".length());
                    bankAccountNumber = new String(java.util.Base64.getDecoder().decode(b64), java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception ignored) {
                    bankAccountNumber = bank.getAccountNumberLast4();
                }
            } else if (bank.getAccountNumberLast4() != null) {
                bankAccountNumber = bank.getAccountNumberLast4();
            }
        }
        String bankIfsc = bank != null ? bank.getIfscCode() : null;

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
                bankUpiId,
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
                merchant.getAddress(),
                bankName,
                accountHolderName,
                bankAccountNumber,
                bankIfsc,
                merchant.getCommissionRate()
        );
    }

    // 23-arg constructor for previous callers
    public MerchantResponse(String id, String ownerUserId, String businessName, String legalName,
                            String description, String categoryId, String categoryName, String phone,
                            String email, String website, String bankUpiId, String gstin,
                            String pan, String status, String approvalStatus, String kycStatus,
                            Instant createdAt, Instant updatedAt, String state, String district,
                            String city, String pincode, String address) {
        this(id, ownerUserId, businessName, legalName, description, categoryId, categoryName,
                phone, email, website, bankUpiId, gstin, pan, status, approvalStatus, kycStatus,
                createdAt, updatedAt, state, district, city, pincode, address, null, null, null, null, null);
    }

    // 18-arg backward-compatible constructor
    public MerchantResponse(String id, String ownerUserId, String businessName, String legalName,
                            String description, String categoryId, String categoryName, String phone,
                            String email, String website, String bankUpiId, String gstin,
                            String pan, String status, String approvalStatus, String kycStatus,
                            Instant createdAt, Instant updatedAt) {
        this(id, ownerUserId, businessName, legalName, description, categoryId, categoryName,
                phone, email, website, bankUpiId, gstin, pan, status, approvalStatus, kycStatus,
                createdAt, updatedAt, null, null, null, null, null, null, null, null, null, null);
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
                status != null ? status.name() : "INACTIVE",
                status != null ? status.name() : "PENDING_APPROVAL",
                kycStatus != null ? kycStatus.name() : null,
                createdAt,
                updatedAt,
                null,
                null,
                null,
                null,
                null,
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
                null,
                null,
                null,
                null,
                null,
                null
        );
    }
}
