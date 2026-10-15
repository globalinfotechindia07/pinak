package com.superapp.mobile.dto;

import java.util.UUID;

public class NewlyAddedStoreCardDto {

    private UUID storeId;
    private UUID merchantId;
    private String storeName;
    private String categoryIcon;
    private String themeColor;
    private String addedTimeAgo;
    private String openingOffer;
    private String locationTag;
    private Long distanceMeters;
    private String distanceLabel;
    private String action;

    public NewlyAddedStoreCardDto() {
    }

    public NewlyAddedStoreCardDto(UUID storeId, UUID merchantId, String storeName, String categoryIcon,
                                  String themeColor, String addedTimeAgo, String openingOffer,
                                  String locationTag, Long distanceMeters, String distanceLabel, String action) {
        this.storeId = storeId;
        this.merchantId = merchantId;
        this.storeName = storeName;
        this.categoryIcon = categoryIcon;
        this.themeColor = themeColor;
        this.addedTimeAgo = addedTimeAgo;
        this.openingOffer = openingOffer;
        this.locationTag = locationTag;
        this.distanceMeters = distanceMeters;
        this.distanceLabel = distanceLabel;
        this.action = action;
    }

    public UUID getStoreId() {
        return storeId;
    }

    public void setStoreId(UUID storeId) {
        this.storeId = storeId;
    }

    public UUID getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(UUID merchantId) {
        this.merchantId = merchantId;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public String getCategoryIcon() {
        return categoryIcon;
    }

    public void setCategoryIcon(String categoryIcon) {
        this.categoryIcon = categoryIcon;
    }

    public String getThemeColor() {
        return themeColor;
    }

    public void setThemeColor(String themeColor) {
        this.themeColor = themeColor;
    }

    public String getAddedTimeAgo() {
        return addedTimeAgo;
    }

    public void setAddedTimeAgo(String addedTimeAgo) {
        this.addedTimeAgo = addedTimeAgo;
    }

    public String getOpeningOffer() {
        return openingOffer;
    }

    public void setOpeningOffer(String openingOffer) {
        this.openingOffer = openingOffer;
    }

    public String getLocationTag() {
        return locationTag;
    }

    public void setLocationTag(String locationTag) {
        this.locationTag = locationTag;
    }

    public Long getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(Long distanceMeters) {
        this.distanceMeters = distanceMeters;
    }

    public String getDistanceLabel() {
        return distanceLabel;
    }

    public void setDistanceLabel(String distanceLabel) {
        this.distanceLabel = distanceLabel;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }
}
