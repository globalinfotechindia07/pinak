package com.superapp.store.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminSuspendStoreRequest(
        @NotBlank(message = "Suspension reason is required")
        @Size(min = 3, max = 1000, message = "Suspension reason must be between 3 and 1000 characters")
        String reason
) {
    public String getReason() {
        return reason;
    }
}
