package com.superapp.reward.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "reward_transactions", indexes = {
        @Index(name = "idx_reward_tx_account", columnList = "reward_account_id"),
        @Index(name = "idx_reward_tx_created", columnList = "created_at")
})
public class RewardTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "reward_account_id", nullable = false)
    private UUID rewardAccountId;

    @Column(name = "points", nullable = false)
    private long points;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    private RewardTransactionType type;

    @Column(name = "reference_type", length = 64)
    private String referenceType;

    @Column(name = "reference_id", length = 64)
    private String referenceId;

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public RewardTransaction() {}

    public RewardTransaction(UUID rewardAccountId, long points, RewardTransactionType type,
                             String referenceType, String referenceId, String description) {
        this.rewardAccountId = rewardAccountId;
        this.points = points;
        this.type = type;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
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

    public UUID getRewardAccountId() { return rewardAccountId; }
    public void setRewardAccountId(UUID rewardAccountId) { this.rewardAccountId = rewardAccountId; }

    public long getPoints() { return points; }
    public void setPoints(long points) { this.points = points; }

    public RewardTransactionType getType() { return type; }
    public void setType(RewardTransactionType type) { this.type = type; }

    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RewardTransaction that = (RewardTransaction) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
