package com.superapp.mobile.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "home_banners")
public class HomeBanner {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "badge_text", nullable = false, length = 100)
    private String badgeText;

    @Column(name = "countdown_end_time")
    private Instant countdownEndTime;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "subtitle", length = 500)
    private String subtitle;

    @Column(name = "cta_text", length = 100)
    private String ctaText = "Claim Pass";

    @Column(name = "cta_action", length = 64)
    private String ctaAction = "CLAIM_PASS";

    @Column(name = "cta_target_id")
    private String ctaTargetId;

    @Column(name = "theme_style", length = 64)
    private String themeStyle = "PRIMARY_GRADIENT";

    @Column(name = "image_url", length = 1024)
    private String imageUrl;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public HomeBanner() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getBadgeText() {
        return badgeText;
    }

    public void setBadgeText(String badgeText) {
        this.badgeText = badgeText;
    }

    public Instant getCountdownEndTime() {
        return countdownEndTime;
    }

    public void setCountdownEndTime(Instant countdownEndTime) {
        this.countdownEndTime = countdownEndTime;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public String getCtaText() {
        return ctaText;
    }

    public void setCtaText(String ctaText) {
        this.ctaText = ctaText;
    }

    public String getCtaAction() {
        return ctaAction;
    }

    public void setCtaAction(String ctaAction) {
        this.ctaAction = ctaAction;
    }

    public String getCtaTargetId() {
        return ctaTargetId;
    }

    public void setCtaTargetId(String ctaTargetId) {
        this.ctaTargetId = ctaTargetId;
    }

    public String getThemeStyle() {
        return themeStyle;
    }

    public void setThemeStyle(String themeStyle) {
        this.themeStyle = themeStyle;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
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
}
