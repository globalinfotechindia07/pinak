package com.superapp.transaction.reward.entity;

import com.superapp.transaction.reward.enums.RewardLedgerStatus;
import com.superapp.transaction.reward.enums.RewardLedgerType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "reward_ledger_entries", indexes = {
        @Index(name = "idx_reward_ledger_customer", columnList = "customer_id"),
        @Index(name = "idx_reward_ledger_account", columnList = "reward_account_id"),
        @Index(name = "idx_reward_ledger_transaction", columnList = "transaction_id"),
        @Index(name = "idx_reward_ledger_redemption", columnList = "redemption_id"),
        @Index(name = "idx_reward_ledger_reference", columnList = "reference_id"),
        @Index(name = "idx_reward_ledger_status", columnList = "status"),
        @Index(name = "idx_reward_ledger_type", columnList = "type"),
        @Index(name = "idx_reward_ledger_created_at", columnList = "created_at")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_reward_ledger_redemption_type", columnNames = {"redemption_id", "type"}),
        @UniqueConstraint(name = "uq_reward_ledger_reference_type", columnNames = {"reference_id", "type"})
})
public class RewardLedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "reward_account_id", nullable = false)
    private UUID rewardAccountId;

    @Column(name = "transaction_id")
    private UUID transactionId;

    @Column(name = "redemption_id")
    private UUID redemptionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    private RewardLedgerType type;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private RewardLedgerStatus status = RewardLedgerStatus.POSTED;

    @Column(name = "reference_id", nullable = false, length = 128)
    private String referenceId;

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public RewardLedgerEntry() {
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null) {
            this.status = RewardLedgerStatus.POSTED;
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public UUID getRewardAccountId() {
        return rewardAccountId;
    }

    public void setRewardAccountId(UUID rewardAccountId) {
        this.rewardAccountId = rewardAccountId;
    }

    public UUID getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(UUID transactionId) {
        this.transactionId = transactionId;
    }

    public UUID getRedemptionId() {
        return redemptionId;
    }

    public void setRedemptionId(UUID redemptionId) {
        this.redemptionId = redemptionId;
    }

    public RewardLedgerType getType() {
        return type;
    }

    public void setType(RewardLedgerType type) {
        this.type = type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public RewardLedgerStatus getStatus() {
        return status;
    }

    public void setStatus(RewardLedgerStatus status) {
        this.status = status;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RewardLedgerEntry that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
