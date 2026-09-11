package com.superapp.discovery.cache;

import com.superapp.discovery.dto.NearbySearchQuery;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class DiscoveryCacheKeyGenerator {

    /**
     * Buckets coordinates by rounding to 3 decimal places (~110m resolution).
     * This avoids unbounded cache key proliferation from minute GPS variances.
     */
    public String generateNearbyKey(NearbySearchQuery query) {
        String latBucket = bucketCoordinate(query.lat());
        String lngBucket = bucketCoordinate(query.lng());
        long radius = Math.round(query.getEffectiveRadius());
        String cat = query.categoryId() != null ? query.categoryId().toString() : "all";
        boolean hasOffer = Boolean.TRUE.equals(query.hasOffer());
        int page = query.getEffectivePage();
        int size = query.getEffectiveSize();
        String sort = query.getEffectiveSort();

        return String.format("discovery:nearby:%s:%s:%d:%s:%b:%s:%d:%d",
                latBucket, lngBucket, radius, cat, hasOffer, sort, page, size);
    }

    public String generateStoreDetailKey(String storeId) {
        return "discovery:store:" + storeId;
    }

    public String generateStoreOffersKey(String storeId, int page, int size) {
        return String.format("discovery:store:%s:offers:%d:%d", storeId, page, size);
    }

    private String bucketCoordinate(Double coord) {
        if (coord == null) return "0.000";
        return BigDecimal.valueOf(coord)
                .setScale(3, RoundingMode.HALF_UP)
                .toPlainString();
    }
}
