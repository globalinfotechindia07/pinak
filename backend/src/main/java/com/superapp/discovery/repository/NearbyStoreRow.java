package com.superapp.discovery.repository;

import java.util.UUID;

public interface NearbyStoreRow {
    UUID getStoreId();
    UUID getMerchantId();
    String getMerchantName();
    String getStoreName();
    String getDescription();
    UUID getCategoryId();
    String getCategoryName();
    String getAddressLine1();
    String getAddressLine2();
    String getCityId();
    String getCityName();
    String getState();
    String getPincode();
    Double getLatitude();
    Double getLongitude();
    Double getDistanceMeters();
    Boolean getHasActiveOffers();
}
