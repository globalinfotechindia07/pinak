package com.superapp.transactionhistory.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "transactions", indexes = {
        @Index(name = "idx_transactions_ref", columnList = "transaction_reference", unique = true),
        @Index(name = "idx_transactions_customer", columnList = "customer_id"),
        @Index(name = "idx_transactions_merchant", columnList = "merchant_id"),
        @Index(name = "idx_transactions_created", columnList = "created_at")
})
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "transaction_reference", nullable = false, unique = true, length = 64)
    private String transactionReference;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;

    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    private TransactionType type = TransactionType.PAYMENT;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private TransactionStatus status = TransactionStatus.SUCCESS;

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Transaction() {}

    public Transaction(String transactionReference, UUID paymentId, UUID customerId, UUID merchantId,
                       UUID storeId, BigDecimal amount, String currency, TransactionType type,
                       TransactionStatus status, String description) {
        this.transactionReference = transactionReference;
        this.paymentId = paymentId;
        this.customerId = customerId;
        this.merchantId = merchantId;
        this.storeId = storeId;
        this.amount = amount;
        this.currency = (currency != null && !currency.isBlank()) ? currency : "INR";
        this.type = type != null ? type : TransactionType.PAYMENT;
        this.status = status != null ? status : TransactionStatus.SUCCESS;
        this.description = description;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public UUID getPaymentId() { return paymentId; }
    public void setPaymentId(UUID paymentId) { this.paymentId = paymentId; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public UUID getMerchantId() { return merchantId; }
    public void setMerchantId(UUID merchantId) { this.merchantId = merchantId; }

    public UUID getStoreId() { return storeId; }
    public void setStoreId(UUID storeId) { this.storeId = storeId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public TransactionStatus getStatus() { return status; }
    public void setStatus(TransactionStatus status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Transaction that = (Transaction) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
