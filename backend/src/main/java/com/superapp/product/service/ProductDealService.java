package com.superapp.product.service;

import com.superapp.product.dto.NearbyProductDealsResponse;
import java.util.UUID;

public interface ProductDealService {
    NearbyProductDealsResponse getNearbyProductDeals(
            Double latitude, Double longitude, Double radiusKm,
            UUID categoryId, UUID merchantId, String sort, Integer limit, String cursor);
}
