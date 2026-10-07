package com.superapp.discovery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MerchantRef(
        String id,
        String name
) implements java.io.Serializable {}
