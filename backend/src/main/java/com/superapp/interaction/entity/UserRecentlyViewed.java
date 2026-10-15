package com.superapp.interaction.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_recently_viewed")
public class UserRecentlyViewed {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "item_type", nullable = false, length = 32)
    private String itemType; // 'PRODUCT' or 'MERCHANT'

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "branch_id")
    private UUID branchId;

    @Column(name = "viewed_at", nullable = false)
    private Instant viewedAt = Instant.now();

    public UserRecentlyViewed() {}

    public UserRecentlyViewed(UUID userId, String itemType, UUID itemId, UUID branchId) {
        this.userId = userId;
        this.itemType = itemType;
        this.itemId = itemId;
        this.branchId = branchId;
        this.viewedAt = Instant.now();
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

    public String getItemType() {
        return itemType;
    }

    public void setItemType(String itemType) {
        this.itemType = itemType;
    }

    public UUID getItemId() {
        return itemId;
    }

    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }

    public UUID getBranchId() {
        return branchId;
    }

    public void setBranchId(UUID branchId) {
        this.branchId = branchId;
    }

    public Instant getViewedAt() {
        return viewedAt;
    }

    public void setViewedAt(Instant viewedAt) {
        this.viewedAt = viewedAt;
    }
}
