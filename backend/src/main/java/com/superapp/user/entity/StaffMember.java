package com.superapp.user.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Unified Staff Assignment Entity supporting:
 * - PLATFORM Staff (Super Admin Console)
 * - MERCHANT Staff (Brand Portal)
 * - STORE Staff (Cashier / POS Operator / Store Manager)
 */
@Entity
@Table(name = "staff_members")
public class StaffMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "role_id", length = 64, nullable = false)
    private String roleId;

    @Column(name = "scope", length = 20, nullable = false)
    private String scope; // 'PLATFORM', 'MERCHANT', 'STORE'

    @Column(name = "merchant_id")
    private UUID merchantId;

    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "pos_pin")
    private String posPin; // Hashed 4-digit PIN for store cashiers

    @Column(name = "status", length = 20, nullable = false)
    private String status = "ACTIVE"; // 'ACTIVE', 'INVITED', 'SUSPENDED'

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "custom_permissions", columnDefinition = "JSONB")
    private String customPermissions = "{}";

    @Column(name = "invited_by")
    private UUID invitedBy;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public StaffMember() {}

    public StaffMember(UUID userId, String roleId, String scope, UUID merchantId, UUID storeId,
                       String posPin, String status, String customPermissions, UUID invitedBy) {
        this.userId = userId;
        this.roleId = roleId;
        this.scope = scope;
        this.merchantId = merchantId;
        this.storeId = storeId;
        this.posPin = posPin;
        this.status = status != null ? status : "ACTIVE";
        this.customPermissions = customPermissions != null ? customPermissions : "{}";
        this.invitedBy = invitedBy;
    }

    public StaffMember(UUID userId, String scope, String roleId, String status) {
        this(userId, roleId, scope, null, null, null, status, "{}", null);
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = "ACTIVE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getRoleId() { return roleId; }
    public void setRoleId(String roleId) { this.roleId = roleId; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public UUID getMerchantId() { return merchantId; }
    public void setMerchantId(UUID merchantId) { this.merchantId = merchantId; }

    public UUID getStoreId() { return storeId; }
    public void setStoreId(UUID storeId) { this.storeId = storeId; }

    public String getPosPin() { return posPin; }
    public void setPosPin(String posPin) { this.posPin = posPin; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCustomPermissions() { return customPermissions; }
    public void setCustomPermissions(String customPermissions) { this.customPermissions = customPermissions; }

    public UUID getInvitedBy() { return invitedBy; }
    public void setInvitedBy(UUID invitedBy) { this.invitedBy = invitedBy; }

    public Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
