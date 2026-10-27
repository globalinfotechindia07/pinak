package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AdminSuspendOfferRequest(
        @NotBlank(message = "Suspension reason is required")
        @Size(max = 500, message = "Reason cannot exceed 500 characters")
        String reason
) {
}
