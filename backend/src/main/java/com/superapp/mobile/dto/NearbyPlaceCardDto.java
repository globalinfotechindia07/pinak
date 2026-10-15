package com.superapp.mobile.dto;

import java.util.UUID;

public class NearbyPlaceCardDto {

    private UUID storeId;
    private UUID merchantId;
    private String storeName;
    private String imageUrl;
    private boolean isVerified;
    private String cuisineOrCategory;
    private String priceRange;
    private Double rating;
    private String reviewCountText;
    private Long distanceMeters;
    private String distanceText;
    private String activeOffer;
    private String actionLabel;
    private String action;

    public NearbyPlaceCardDto() {
    }

    public NearbyPlaceCardDto(UUID storeId, UUID merchantId, String storeName, String imageUrl,
                              boolean isVerified, String cuisineOrCategory, String priceRange,
                              Double rating, String reviewCountText, Long distanceMeters,
                              String distanceText, String activeOffer, String actionLabel, String action) {
        this.storeId = storeId;
        this.merchantId = merchantId;
        this.storeName = storeName;
        this.imageUrl = imageUrl;
        this.isVerified = isVerified;
        this.cuisineOrCategory = cuisineOrCategory;
        this.priceRange = priceRange;
        this.rating = rating;
        this.reviewCountText = reviewCountText;
        this.distanceMeters = distanceMeters;
        this.distanceText = distanceText;
        this.activeOffer = activeOffer;
        this.actionLabel = actionLabel;
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

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public boolean isVerified() {
        return isVerified;
    }

    public void setVerified(boolean verified) {
        isVerified = verified;
    }

    public String getCuisineOrCategory() {
        return cuisineOrCategory;
    }

    public void setCuisineOrCategory(String cuisineOrCategory) {
        this.cuisineOrCategory = cuisineOrCategory;
    }

    public String getPriceRange() {
        return priceRange;
    }

    public void setPriceRange(String priceRange) {
        this.priceRange = priceRange;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public String getReviewCountText() {
        return reviewCountText;
    }

    public void setReviewCountText(String reviewCountText) {
        this.reviewCountText = reviewCountText;
    }

    public Long getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(Long distanceMeters) {
        this.distanceMeters = distanceMeters;
    }

    public String getDistanceText() {
        return distanceText;
    }

    public void setDistanceText(String distanceText) {
        this.distanceText = distanceText;
    }

    public String getActiveOffer() {
        return activeOffer;
    }

    public void setActiveOffer(String activeOffer) {
        this.activeOffer = activeOffer;
    }

    public String getActionLabel() {
        return actionLabel;
    }

    public void setActionLabel(String actionLabel) {
        this.actionLabel = actionLabel;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }
}
