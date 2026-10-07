package com.superapp.discovery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record StoreSearchResponse(
        String id,
        String merchantId,
        String merchantName,
        String name,
        CategoryRef category,
        LocationRef location,
        Double distanceMeters
) implements java.io.Serializable {}
