package com.superapp.transaction.reward.entity;

import com.superapp.transaction.reward.enums.RewardAccountStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
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

    @Column(name = "available_balance", nullable = false, precision = 12, scale = 2)
    private BigDecimal availableBalance = BigDecimal.ZERO;

    @Column(name = "pending_balance", nullable = false, precision = 12, scale = 2)
    private BigDecimal pendingBalance = BigDecimal.ZERO;

    @Column(name = "lifetime_earned", nullable = false, precision = 12, scale = 2)
    private BigDecimal lifetimeEarned = BigDecimal.ZERO;

    @Column(name = "lifetime_redeemed", nullable = false, precision = 12, scale = 2)
    private BigDecimal lifetimeRedeemed = BigDecimal.ZERO;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private RewardAccountStatus status = RewardAccountStatus.ACTIVE;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public RewardAccount() {
    }

    public RewardAccount(UUID customerId) {
        this.customerId = customerId;
        this.availableBalance = BigDecimal.ZERO;
        this.pendingBalance = BigDecimal.ZERO;
        this.lifetimeEarned = BigDecimal.ZERO;
        this.lifetimeRedeemed = BigDecimal.ZERO;
        this.currency = "INR";
        this.status = RewardAccountStatus.ACTIVE;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.availableBalance == null) this.availableBalance = BigDecimal.ZERO;
        if (this.pendingBalance == null) this.pendingBalance = BigDecimal.ZERO;
        if (this.lifetimeEarned == null) this.lifetimeEarned = BigDecimal.ZERO;
        if (this.lifetimeRedeemed == null) this.lifetimeRedeemed = BigDecimal.ZERO;
        if (this.currency == null) this.currency = "INR";
        if (this.status == null) this.status = RewardAccountStatus.ACTIVE;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
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

    public BigDecimal getAvailableBalance() {
        return availableBalance;
    }

    public void setAvailableBalance(BigDecimal availableBalance) {
        this.availableBalance = availableBalance;
    }

    public BigDecimal getPendingBalance() {
        return pendingBalance;
    }

    public void setPendingBalance(BigDecimal pendingBalance) {
        this.pendingBalance = pendingBalance;
    }

    public BigDecimal getLifetimeEarned() {
        return lifetimeEarned;
    }

    public void setLifetimeEarned(BigDecimal lifetimeEarned) {
        this.lifetimeEarned = lifetimeEarned;
    }

    public BigDecimal getLifetimeRedeemed() {
        return lifetimeRedeemed;
    }

    public void setLifetimeRedeemed(BigDecimal lifetimeRedeemed) {
        this.lifetimeRedeemed = lifetimeRedeemed;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public RewardAccountStatus getStatus() {
        return status;
    }

    public void setStatus(RewardAccountStatus status) {
        this.status = status;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
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
        if (!(o instanceof RewardAccount that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
