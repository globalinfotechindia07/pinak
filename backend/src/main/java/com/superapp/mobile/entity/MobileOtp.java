package com.superapp.mobile.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Database entity for storing mobile OTP verification challenges.
 * Acts as the primary transactional ledger for OTP lifecycles.
 */
@Entity
@Table(name = "mobile_otps")
public class MobileOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "otp_code", nullable = false, length = 10)
    private String otpCode;

    @Column(name = "session_id", nullable = false, length = 50)
    private String sessionId;

    @Column(name = "channel", nullable = false, length = 20)
    private String channel = "SMS";

    @Column(name = "attempts", nullable = false)
    private int attempts = 0;

    @Column(name = "is_verified", nullable = false)
    private boolean verified = false;

    @Column(name = "is_consumed", nullable = false)
    private boolean consumed = false;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "cooldown_until")
    private Instant cooldownUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public MobileOtp() {}

    public MobileOtp(String phone, String otpCode, String sessionId, String channel, Instant expiresAt, Instant cooldownUntil) {
        this.phone = phone;
        this.otpCode = otpCode;
        this.sessionId = sessionId;
        this.channel = channel != null ? channel : "SMS";
        this.expiresAt = expiresAt;
        this.cooldownUntil = cooldownUntil;
        this.attempts = 0;
        this.verified = false;
        this.consumed = false;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // ---- Getters and Setters ----

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getOtpCode() { return otpCode; }
    public void setOtpCode(String otpCode) { this.otpCode = otpCode; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public boolean isConsumed() { return consumed; }
    public void setConsumed(boolean consumed) { this.consumed = consumed; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getCooldownUntil() { return cooldownUntil; }
    public void setCooldownUntil(Instant cooldownUntil) { this.cooldownUntil = cooldownUntil; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
