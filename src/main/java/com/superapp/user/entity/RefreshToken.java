package com.superapp.user.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Stores hashed refresh tokens with rotation family tracking.
 * <p>
 * Rotation strategy:
 * - Each successful use rotates to a new token (old → revoked, new → active), same family_id.
 * - If a revoked token is presented again → entire family is revoked → force re-login.
 * - Raw token is never stored; only SHA-256(rawToken) is persisted.
 */
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private UserSession session;

    /** SHA-256 hash of the raw token string. Never store plaintext. */
    @Column(name = "token_hash", nullable = false, unique = true, length = 255)
    private String tokenHash;

    /** Groups a chain of rotated tokens; used to detect and revoke reused tokens. */
    @Column(name = "family_id", nullable = false, updatable = false)
    private UUID familyId;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private Instant issuedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    public RefreshToken() {}

    @PrePersist
    protected void onCreate() {
        this.issuedAt = Instant.now();
    }

    public boolean isActive() {
        return revokedAt == null && expiresAt.isAfter(Instant.now());
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    // ---- Getters & Setters ----

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public UserSession getSession() { return session; }
    public void setSession(UserSession session) { this.session = session; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public UUID getFamilyId() { return familyId; }
    public void setFamilyId(UUID familyId) { this.familyId = familyId; }

    public Instant getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }
}
