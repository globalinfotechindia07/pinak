package com.superapp.user.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Unified Roles Entity supporting:
 * - PLATFORM (Super Admin Panel)
 * - MERCHANT (Brand Portal)
 * - STORE (Branch / POS Counter)
 */
@Entity
@Table(name = "roles")
public class RoleEntity {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @Column(name = "scope", length = 20, nullable = false)
    private String scope; // 'PLATFORM', 'MERCHANT', 'STORE'

    @Column(name = "scope_id")
    private UUID scopeId; // NULL for platform; merchant_id or store_id for custom roles

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "badge_cls", length = 255)
    private String badgeCls;

    @Column(name = "is_system", nullable = false)
    private boolean isSystem = false;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "permissions", columnDefinition = "JSONB", nullable = false)
    private String permissions = "{}";

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public RoleEntity() {}

    public RoleEntity(String id, String scope, UUID scopeId, String name, String description,
                      String badgeCls, boolean isSystem, String permissions, UUID createdBy) {
        this.id = id;
        this.scope = scope;
        this.scopeId = scopeId;
        this.name = name;
        this.description = description;
        this.badgeCls = badgeCls;
        this.isSystem = isSystem;
        this.permissions = permissions;
        this.createdBy = createdBy;
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

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public UUID getScopeId() { return scopeId; }
    public void setScopeId(UUID scopeId) { this.scopeId = scopeId; }

    public String getName() { return name; }
    public String getDisplayName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getBadgeCls() { return badgeCls; }
    public void setBadgeCls(String badgeCls) { this.badgeCls = badgeCls; }

    public boolean isSystem() { return isSystem; }
    public void setSystem(boolean system) { isSystem = system; }

    public String getPermissions() { return permissions; }
    public void setPermissions(String permissions) { this.permissions = permissions; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
