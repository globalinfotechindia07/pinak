package com.superapp.discovery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CategoryRef(
        String id,
        String name
) implements java.io.Serializable {}
