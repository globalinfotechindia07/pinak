package com.superapp.discovery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LocationRef(
        Double latitude,
        Double longitude
) implements java.io.Serializable {}
