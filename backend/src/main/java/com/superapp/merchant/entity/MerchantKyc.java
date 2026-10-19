package com.superapp.merchant.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "merchant_kyc")
public class MerchantKyc {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;

    @Column(name = "business_type", length = 64)
    private String businessType;

    @Column(name = "pan_number", length = 10)
    private String panNumber;

    @Column(name = "gstin", length = 15)
    private String gstin;

    @Column(name = "bank_account_number", length = 34)
    private String bankAccountNumber;

    @Column(name = "bank_ifsc", length = 11)
    private String bankIfsc;

    @Column(name = "bank_name", length = 128)
    private String bankName;

    @Column(name = "document_type", length = 64)
    private String documentType;

    @Column(name = "document_number", length = 128)
    private String documentNumber;

    @Column(name = "business_registration_number", length = 128)
    private String businessRegistrationNumber;

    @Column(name = "tax_id", length = 128)
    private String taxId;

    @Column(name = "document_url", length = 1024)
    private String documentUrl;

    @Column(name = "verification_status", nullable = false, length = 32)
    private String status = "SUBMITTED";

    @Column(name = "verified_by")
    private UUID verifiedBy;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public MerchantKyc() {}

    public MerchantKyc(UUID merchantId, String documentType, String documentNumber,
                       String businessRegistrationNumber, String taxId, String documentUrl) {
        this.merchantId = merchantId;
        this.documentType = documentType;
        this.documentNumber = documentNumber;
        this.businessRegistrationNumber = businessRegistrationNumber;
        this.taxId = taxId;
        this.documentUrl = documentUrl;
        this.status = "SUBMITTED";
    }

    public MerchantKyc(UUID merchantId, String businessType, String panNumber, String gstin,
                       String bankAccountNumber, String bankIfsc, String bankName, String status) {
        this.merchantId = merchantId;
        this.businessType = businessType;
        this.panNumber = panNumber;
        this.gstin = gstin;
        this.bankAccountNumber = bankAccountNumber;
        this.bankIfsc = bankIfsc;
        this.bankName = bankName;
        this.documentType = "PAN_CARD";
        this.documentNumber = panNumber;
        this.status = status != null ? status : "SUBMITTED";
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.submittedAt == null) {
            this.submittedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getMerchantId() { return merchantId; }
    public void setMerchantId(UUID merchantId) { this.merchantId = merchantId; }

    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }

    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }

    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }

    public String getBankIfsc() { return bankIfsc; }
    public void setBankIfsc(String bankIfsc) { this.bankIfsc = bankIfsc; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }

    public String getBusinessRegistrationNumber() { return businessRegistrationNumber; }
    public void setBusinessRegistrationNumber(String businessRegistrationNumber) { this.businessRegistrationNumber = businessRegistrationNumber; }

    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }

    public String getDocumentUrl() { return documentUrl; }
    public void setDocumentUrl(String documentUrl) { this.documentUrl = documentUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(UUID verifiedBy) { this.verifiedBy = verifiedBy; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
