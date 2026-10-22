package com.superapp.discovery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record StoreDiscoveryDetailResponse(
        String id,
        MerchantRef merchant,
        String name,
        String description,
        CategoryRef category,
        AddressRef address,
        LocationRef location,
        String phone,
        String status,
        String openingTime,
        String closingTime,
        String operatingDays,
        List<String> menuImages,
        List<String> photos,
        List<String> amenities
) implements java.io.Serializable {
    public StoreDiscoveryDetailResponse(
            String id,
            MerchantRef merchant,
            String name,
            String description,
            CategoryRef category,
            AddressRef address,
            LocationRef location,
            String phone,
            String status
    ) {
        this(id, merchant, name, description, category, address, location, phone, status,
             "10:00", "22:00", "Daily (Mon - Sun)", java.util.Collections.emptyList(), java.util.Collections.emptyList(), java.util.Collections.emptyList());
    }
}
