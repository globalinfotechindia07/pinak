package com.superapp.store.mapper;

import com.superapp.store.dto.StoreResponse;
import com.superapp.store.entity.Store;
import org.springframework.stereotype.Component;

@Component
public class StoreMapper {

    public StoreResponse toResponse(Store store) {
        return toResponse(store, null, null, null);
    }

    public StoreResponse toResponse(Store store, String merchantName) {
        return toResponse(store, merchantName, null, null);
    }

    public StoreResponse toResponse(Store store, String merchantName, String cityName) {
        return toResponse(store, merchantName, cityName, null);
    }

    public StoreResponse toResponse(Store store, String merchantName, String cityName, Double distanceMeters) {
        return StoreResponse.fromEntity(store, merchantName, cityName, distanceMeters);
    }
}
