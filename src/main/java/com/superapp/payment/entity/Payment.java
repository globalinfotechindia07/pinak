package com.superapp.payment.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payments_reference", columnList = "payment_reference", unique = true),
        @Index(name = "idx_payments_customer", columnList = "customer_id"),
        @Index(name = "idx_payments_merchant", columnList = "merchant_id"),
        @Index(name = "idx_payments_status", columnList = "status")
})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "payment_reference", nullable = false, unique = true, length = 64)
    private String paymentReference;

    @Column(name = "gateway_transaction_id", length = 128)
    private String gatewayTransactionId;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;

    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "offer_id")
    private UUID offerId;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 32)
    private PaymentMethod paymentMethod = PaymentMethod.UPI;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private PaymentStatus status = PaymentStatus.INITIATED;

    @Column(name = "failure_reason", length = 512)
    private String failureReason;

    @Column(name = "notes", length = 512)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Payment() {}

    public Payment(String paymentReference, UUID customerId, UUID merchantId, UUID storeId,
                   UUID offerId, BigDecimal amount, String currency, PaymentMethod paymentMethod, String notes) {
        this.paymentReference = paymentReference;
        this.customerId = customerId;
        this.merchantId = merchantId;
        this.storeId = storeId;
        this.offerId = offerId;
        this.amount = amount;
        this.currency = (currency != null && !currency.isBlank()) ? currency : "INR";
        this.paymentMethod = paymentMethod != null ? paymentMethod : PaymentMethod.UPI;
        this.status = PaymentStatus.INITIATED;
        this.notes = notes;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = PaymentStatus.INITIATED;
        }
        if (this.currency == null) {
            this.currency = "INR";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // ---- Getters & Setters ----

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public String getGatewayTransactionId() { return gatewayTransactionId; }
    public void setGatewayTransactionId(String gatewayTransactionId) { this.gatewayTransactionId = gatewayTransactionId; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public UUID getMerchantId() { return merchantId; }
    public void setMerchantId(UUID merchantId) { this.merchantId = merchantId; }

    public UUID getStoreId() { return storeId; }
    public void setStoreId(UUID storeId) { this.storeId = storeId; }

    public UUID getOfferId() { return offerId; }
    public void setOfferId(UUID offerId) { this.offerId = offerId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Payment payment = (Payment) o;
        return Objects.equals(id, payment.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
