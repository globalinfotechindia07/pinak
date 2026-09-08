package com.superapp.reward.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "reward_accounts", indexes = {
        @Index(name = "idx_reward_accounts_customer", columnList = "customer_id", unique = true)
})
public class RewardAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "customer_id", nullable = false, unique = true)
    private UUID customerId;

    @Column(name = "points_balance", nullable = false)
    private long pointsBalance = 0;

    @Column(name = "lifetime_earned", nullable = false)
    private long lifetimeEarned = 0;

    @Column(name = "lifetime_redeemed", nullable = false)
    private long lifetimeRedeemed = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private RewardAccountStatus status = RewardAccountStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public RewardAccount() {}

    public RewardAccount(UUID customerId) {
        this.customerId = customerId;
        this.pointsBalance = 0;
        this.lifetimeEarned = 0;
        this.lifetimeRedeemed = 0;
        this.status = RewardAccountStatus.ACTIVE;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = RewardAccountStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public long getPointsBalance() { return pointsBalance; }
    public void setPointsBalance(long pointsBalance) { this.pointsBalance = pointsBalance; }

    public long getLifetimeEarned() { return lifetimeEarned; }
    public void setLifetimeEarned(long lifetimeEarned) { this.lifetimeEarned = lifetimeEarned; }

    public long getLifetimeRedeemed() { return lifetimeRedeemed; }
    public void setLifetimeRedeemed(long lifetimeRedeemed) { this.lifetimeRedeemed = lifetimeRedeemed; }

    public RewardAccountStatus getStatus() { return status; }
    public void setStatus(RewardAccountStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RewardAccount that = (RewardAccount) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
