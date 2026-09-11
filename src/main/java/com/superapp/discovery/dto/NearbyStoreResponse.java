package com.superapp.discovery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record NearbyStoreResponse(
        String id,
        String merchantId,
        String merchantName,
        String name,
        CategoryRef category,
        AddressRef address,
        LocationRef location,
        Double distanceMeters,
        Boolean hasActiveOffers
) implements java.io.Serializable {}
