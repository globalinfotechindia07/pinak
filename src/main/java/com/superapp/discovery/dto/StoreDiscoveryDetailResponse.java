package com.superapp.discovery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

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
        String status
) implements java.io.Serializable {}
