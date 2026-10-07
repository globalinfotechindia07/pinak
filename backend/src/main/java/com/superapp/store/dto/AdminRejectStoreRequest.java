package com.superapp.store.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminRejectStoreRequest(
        @NotBlank(message = "Rejection reason is required")
        @Size(min = 3, max = 1000, message = "Rejection reason must be between 3 and 1000 characters")
        String reason
) {
    public String getReason() {
        return reason;
    }
}
