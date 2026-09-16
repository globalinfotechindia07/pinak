package com.superapp.transaction.notification.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "notification_preferences", indexes = {
        @Index(name = "idx_notification_preferences_user", columnList = "user_id")
})
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "payment_notifications", nullable = false)
    private boolean paymentNotifications = true;

    @Column(name = "reward_notifications", nullable = false)
    private boolean rewardNotifications = true;

    @Column(name = "offer_notifications", nullable = false)
    private boolean offerNotifications = true;

    @Column(name = "system_notifications", nullable = false)
    private boolean systemNotifications = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public NotificationPreference() {
    }

    public NotificationPreference(UUID userId) {
        this.userId = userId;
        this.paymentNotifications = true;
        this.rewardNotifications = true;
        this.offerNotifications = true;
        this.systemNotifications = true;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public boolean isPaymentNotifications() {
        return paymentNotifications;
    }

    public void setPaymentNotifications(boolean paymentNotifications) {
        this.paymentNotifications = paymentNotifications;
    }

    public boolean isRewardNotifications() {
        return rewardNotifications;
    }

    public void setRewardNotifications(boolean rewardNotifications) {
        this.rewardNotifications = rewardNotifications;
    }

    public boolean isOfferNotifications() {
        return offerNotifications;
    }

    public void setOfferNotifications(boolean offerNotifications) {
        this.offerNotifications = offerNotifications;
    }

    public boolean isSystemNotifications() {
        return systemNotifications;
    }

    public void setSystemNotifications(boolean systemNotifications) {
        this.systemNotifications = systemNotifications;
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
        if (o == null || getClass() != o.getClass()) return false;
        NotificationPreference that = (NotificationPreference) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
