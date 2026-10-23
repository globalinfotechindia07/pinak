package com.superapp.mobile.service;

import com.superapp.mobile.dto.MobileServiceDetailDto;
import java.util.UUID;

public interface MobileServiceDetailService {

    /**
     * Retrieve complete mobile store/service card detail payload matching code.html specification.
     *
     * @param storeId Store outlet UUID
     * @param userLat Optional customer device latitude
     * @param userLng Optional customer device longitude
     * @return Full MobileServiceDetailDto containing hero, offers, menu highlights, flash deals,
     *         photos, amenities, location, concierge, and similar places.
     */
    MobileServiceDetailDto getServiceDetail(UUID storeId, Double userLat, Double userLng);
}
