package com.superapp.transaction.payment.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "webhook_events", uniqueConstraints = {
        @UniqueConstraint(name = "uq_webhook_provider_event", columnNames = {"provider", "provider_event_id"})
}, indexes = {
        @Index(name = "idx_webhook_events_payment", columnList = "payment_id"),
        @Index(name = "idx_webhook_events_processed", columnList = "processed_at")
})
public class WebhookEventLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "provider", nullable = false, length = 64)
    private String provider;

    @Column(name = "provider_event_id", nullable = false, length = 128)
    private String providerEventId;

    @Column(name = "event_type", length = 64)
    private String eventType;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload;

    @Column(name = "status", nullable = false, length = 32)
    private String status = "PROCESSED";

    @Column(name = "processed_at", nullable = false)
    private Instant processedAt;

    public WebhookEventLog() {}

    public WebhookEventLog(String provider, String providerEventId, String eventType, UUID paymentId, String payload) {
        this.provider = provider;
        this.providerEventId = providerEventId;
        this.eventType = eventType;
        this.paymentId = paymentId;
        this.payload = payload;
        this.status = "PROCESSED";
        this.processedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.processedAt == null) {
            this.processedAt = Instant.now();
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getProviderEventId() { return providerEventId; }
    public void setProviderEventId(String providerEventId) { this.providerEventId = providerEventId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public UUID getPaymentId() { return paymentId; }
    public void setPaymentId(UUID paymentId) { this.paymentId = paymentId; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getProcessedAt() { return processedAt; }
    public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WebhookEventLog that = (WebhookEventLog) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
