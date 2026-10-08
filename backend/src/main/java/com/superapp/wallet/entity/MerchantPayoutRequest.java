package com.superapp.wallet.entity;

import com.superapp.wallet.enums.PayoutMode;
import com.superapp.wallet.enums.PayoutProvider;
import com.superapp.wallet.enums.PayoutStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "merchant_payout_requests")
public class MerchantPayoutRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;

    @Column(name = "wallet_id", nullable = false)
    private UUID walletId;

    @Column(name = "bank_account_id", nullable = false)
    private UUID bankAccountId;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "payout_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal payoutFee = BigDecimal.ZERO;

    @Column(name = "net_payout", nullable = false, precision = 14, scale = 2)
    private BigDecimal netPayout;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false, length = 16)
    private PayoutMode mode = PayoutMode.IMPS;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private PayoutStatus status = PayoutStatus.INITIATED;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 64)
    private PayoutProvider provider = PayoutProvider.RAZORPAYX;

    @Column(name = "provider_payout_id", length = 128)
    private String providerPayoutId;

    @Column(name = "bank_utr", length = 64)
    private String bankUtr;

    @Column(name = "idempotency_key", nullable = false, unique = true)
    private UUID idempotencyKey;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "requested_by", nullable = false)
    private UUID requestedBy;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public MerchantPayoutRequest() {}

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.payoutFee == null) this.payoutFee = BigDecimal.ZERO;
        if (this.currency == null) this.currency = "INR";
        if (this.mode == null) this.mode = PayoutMode.IMPS;
        if (this.status == null) this.status = PayoutStatus.INITIATED;
        if (this.provider == null) this.provider = PayoutProvider.RAZORPAYX;
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

    public UUID getWalletId() {
        return walletId;
    }

    public void setWalletId(UUID walletId) {
        this.walletId = walletId;
    }

    public UUID getBankAccountId() {
        return bankAccountId;
    }

    public void setBankAccountId(UUID bankAccountId) {
        this.bankAccountId = bankAccountId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getPayoutFee() {
        return payoutFee;
    }

    public void setPayoutFee(BigDecimal payoutFee) {
        this.payoutFee = payoutFee;
    }

    public BigDecimal getNetPayout() {
        return netPayout;
    }

    public void setNetPayout(BigDecimal netPayout) {
        this.netPayout = netPayout;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public PayoutMode getMode() {
        return mode;
    }

    public void setMode(PayoutMode mode) {
        this.mode = mode;
    }

    public PayoutStatus getStatus() {
        return status;
    }

    public void setStatus(PayoutStatus status) {
        this.status = status;
    }

    public PayoutProvider getProvider() {
        return provider;
    }

    public void setProvider(PayoutProvider provider) {
        this.provider = provider;
    }

    public String getProviderPayoutId() {
        return providerPayoutId;
    }

    public void setProviderPayoutId(String providerPayoutId) {
        this.providerPayoutId = providerPayoutId;
    }

    public String getBankUtr() {
        return bankUtr;
    }

    public void setBankUtr(String bankUtr) {
        this.bankUtr = bankUtr;
    }

    public UUID getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(UUID idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public UUID getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(UUID requestedBy) {
        this.requestedBy = requestedBy;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(Instant processedAt) {
        this.processedAt = processedAt;
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
        if (!(o instanceof MerchantPayoutRequest request)) return false;
        return Objects.equals(id, request.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
