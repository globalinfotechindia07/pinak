package com.superapp.mobile.dto;

import java.util.UUID;

public class HomeBannerDto {

    private UUID id;
    private String badgeText;
    private String countdownText;
    private String title;
    private String subtitle;
    private String ctaText;
    private String ctaAction;
    private String ctaTargetId;
    private String themeStyle;
    private String imageUrl;

    public HomeBannerDto() {
    }

    public HomeBannerDto(UUID id, String badgeText, String countdownText, String title, String subtitle,
                         String ctaText, String ctaAction, String ctaTargetId, String themeStyle, String imageUrl) {
        this.id = id;
        this.badgeText = badgeText;
        this.countdownText = countdownText;
        this.title = title;
        this.subtitle = subtitle;
        this.ctaText = ctaText;
        this.ctaAction = ctaAction;
        this.ctaTargetId = ctaTargetId;
        this.themeStyle = themeStyle;
        this.imageUrl = imageUrl;
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

    public String getCountdownText() {
        return countdownText;
    }

    public void setCountdownText(String countdownText) {
        this.countdownText = countdownText;
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
}
