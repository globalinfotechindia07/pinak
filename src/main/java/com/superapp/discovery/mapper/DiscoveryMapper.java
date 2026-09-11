package com.superapp.discovery.mapper;

import com.superapp.category.entity.Category;
import com.superapp.discovery.dto.*;
import com.superapp.merchant.entity.Merchant;
import com.superapp.store.entity.City;
import com.superapp.store.entity.Store;
import org.springframework.stereotype.Component;

@Component
public class DiscoveryMapper {

    public NearbyStoreResponse toNearbyResponse(
            Store store,
            Merchant merchant,
            Category category,
            City city,
            Double distanceMeters,
            Boolean hasActiveOffers) {
        if (store == null) return null;

        String merchantName = merchant != null ? merchant.getBusinessName() : "";
        String merchantIdStr = merchant != null ? merchant.getId().toString() : store.getMerchantId().toString();

        CategoryRef categoryRef = category != null
                ? new CategoryRef(category.getId().toString(), category.getName())
                : null;

        String cityName = city != null ? city.getName() : store.getState();
        AddressRef addressRef = new AddressRef(
                store.getAddressLine1(),
                store.getAddressLine2(),
                cityName,
                store.getState(),
                store.getPincode()
        );

        LocationRef locationRef = new LocationRef(
                store.getLatitude() != null ? store.getLatitude().doubleValue() : null,
                store.getLongitude() != null ? store.getLongitude().doubleValue() : null
        );

        return new NearbyStoreResponse(
                store.getId().toString(),
                merchantIdStr,
                merchantName,
                store.getStoreName(),
                categoryRef,
                addressRef,
                locationRef,
                distanceMeters != null ? Math.round(distanceMeters * 10.0) / 10.0 : null,
                Boolean.TRUE.equals(hasActiveOffers)
        );
    }

    public NearbyStoreResponse toNearbyResponse(com.superapp.discovery.repository.NearbyStoreRow row) {
        if (row == null) return null;

        CategoryRef categoryRef = row.getCategoryId() != null
                ? new CategoryRef(row.getCategoryId().toString(), row.getCategoryName())
                : null;

        AddressRef addressRef = new AddressRef(
                row.getAddressLine1(),
                row.getAddressLine2(),
                row.getCityName() != null ? row.getCityName() : row.getState(),
                row.getState(),
                row.getPincode()
        );

        LocationRef locationRef = new LocationRef(
                row.getLatitude(),
                row.getLongitude()
        );

        return new NearbyStoreResponse(
                row.getStoreId().toString(),
                row.getMerchantId().toString(),
                row.getMerchantName(),
                row.getStoreName(),
                categoryRef,
                addressRef,
                locationRef,
                row.getDistanceMeters() != null ? Math.round(row.getDistanceMeters() * 10.0) / 10.0 : null,
                Boolean.TRUE.equals(row.getHasActiveOffers())
        );
    }

    public StoreSearchResponse toSearchResponse(
            Store store,
            Merchant merchant,
            Category category,
            Double distanceMeters) {
        if (store == null) return null;

        String merchantName = merchant != null ? merchant.getBusinessName() : "";
        String merchantIdStr = merchant != null ? merchant.getId().toString() : store.getMerchantId().toString();

        CategoryRef categoryRef = category != null
                ? new CategoryRef(category.getId().toString(), category.getName())
                : null;

        LocationRef locationRef = new LocationRef(
                store.getLatitude() != null ? store.getLatitude().doubleValue() : null,
                store.getLongitude() != null ? store.getLongitude().doubleValue() : null
        );

        return new StoreSearchResponse(
                store.getId().toString(),
                merchantIdStr,
                merchantName,
                store.getStoreName(),
                categoryRef,
                locationRef,
                distanceMeters != null ? Math.round(distanceMeters * 10.0) / 10.0 : null
        );
    }

    public StoreSearchResponse toSearchResponse(com.superapp.discovery.repository.NearbyStoreRow row) {
        if (row == null) return null;

        CategoryRef categoryRef = row.getCategoryId() != null
                ? new CategoryRef(row.getCategoryId().toString(), row.getCategoryName())
                : null;

        LocationRef locationRef = new LocationRef(
                row.getLatitude(),
                row.getLongitude()
        );

        return new StoreSearchResponse(
                row.getStoreId().toString(),
                row.getMerchantId().toString(),
                row.getMerchantName(),
                row.getStoreName(),
                categoryRef,
                locationRef,
                row.getDistanceMeters() != null ? Math.round(row.getDistanceMeters() * 10.0) / 10.0 : null
        );
    }

    public StoreDiscoveryDetailResponse toDetailResponse(
            Store store,
            Merchant merchant,
            Category category,
            City city) {
        if (store == null) return null;

        MerchantRef merchantRef = merchant != null
                ? new MerchantRef(merchant.getId().toString(), merchant.getBusinessName())
                : new MerchantRef(store.getMerchantId().toString(), "");

        CategoryRef categoryRef = category != null
                ? new CategoryRef(category.getId().toString(), category.getName())
                : null;

        String cityName = city != null ? city.getName() : store.getState();
        AddressRef addressRef = new AddressRef(
                store.getAddressLine1(),
                store.getAddressLine2(),
                cityName,
                store.getState(),
                store.getPincode()
        );

        LocationRef locationRef = new LocationRef(
                store.getLatitude() != null ? store.getLatitude().doubleValue() : null,
                store.getLongitude() != null ? store.getLongitude().doubleValue() : null
        );

        return new StoreDiscoveryDetailResponse(
                store.getId().toString(),
                merchantRef,
                store.getStoreName(),
                store.getDescription(),
                categoryRef,
                addressRef,
                locationRef,
                store.getPhone(),
                store.getStatus() != null ? store.getStatus().name() : "ACTIVE"
        );
    }
}
