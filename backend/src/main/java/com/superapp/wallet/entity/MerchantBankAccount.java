package com.superapp.wallet.entity;

import com.superapp.wallet.enums.BankAccountVerificationStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "merchant_bank_accounts")
public class MerchantBankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;

    @Column(name = "account_holder_name", nullable = false, length = 255)
    private String accountHolderName;

    @Column(name = "bank_name", nullable = false, length = 128)
    private String bankName;

    @Column(name = "account_number_encrypted", nullable = false, length = 512)
    private String accountNumberEncrypted;

    @Column(name = "account_number_last4", nullable = false, length = 4)
    private String accountNumberLast4;

    @Column(name = "ifsc_code", nullable = false, length = 16)
    private String ifscCode;

    @Column(name = "upi_vpa", length = 100)
    private String upiVpa;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 32)
    private BankAccountVerificationStatus verificationStatus = BankAccountVerificationStatus.PENDING;

    @Column(name = "penny_drop_reference", length = 128)
    private String pennyDropReference;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public MerchantBankAccount() {}

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.isPrimary == null) this.isPrimary = true;
        if (this.verificationStatus == null) this.verificationStatus = BankAccountVerificationStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(UUID merchantId) {
        this.merchantId = merchantId;
    }

    public String getAccountHolderName() {
        return accountHolderName;
    }

    public void setAccountHolderName(String accountHolderName) {
        this.accountHolderName = accountHolderName;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getAccountNumberEncrypted() {
        return accountNumberEncrypted;
    }

    public void setAccountNumberEncrypted(String accountNumberEncrypted) {
        this.accountNumberEncrypted = accountNumberEncrypted;
    }

    public String getAccountNumberLast4() {
        return accountNumberLast4;
    }

    public void setAccountNumberLast4(String accountNumberLast4) {
        this.accountNumberLast4 = accountNumberLast4;
    }

    public String getIfscCode() {
        return ifscCode;
    }

    public void setIfscCode(String ifscCode) {
        this.ifscCode = ifscCode;
    }

    public String getUpiVpa() {
        return upiVpa;
    }

    public void setUpiVpa(String upiVpa) {
        this.upiVpa = upiVpa;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
    }

    public BankAccountVerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(BankAccountVerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getPennyDropReference() {
        return pennyDropReference;
    }

    public void setPennyDropReference(String pennyDropReference) {
        this.pennyDropReference = pennyDropReference;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MerchantBankAccount bankAccount)) return false;
        return Objects.equals(id, bankAccount.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
