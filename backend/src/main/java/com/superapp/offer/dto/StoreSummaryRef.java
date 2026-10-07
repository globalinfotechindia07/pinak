package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.io.Serializable;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record StoreSummaryRef(
        String id,
        String name
) implements Serializable {}
