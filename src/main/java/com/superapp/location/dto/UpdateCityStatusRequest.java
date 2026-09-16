package com.superapp.location.dto;

import com.superapp.store.enums.CityStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateCityStatusRequest(
        @NotNull(message = "City status is required")
        CityStatus status,

        String reason
) {
}
