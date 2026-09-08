package com.superapp.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for login.
 * 'identifier' accepts email or mobile number.
 * 'deviceId' and 'deviceName' are optional but recommended for session tracking.
 */
public record LoginRequest(
        @NotBlank(message = "Identifier (email or mobile) is required")
        @Size(max = 255, message = "Identifier must not exceed 255 characters")
        String identifier,

        @NotBlank(message = "Password is required")
        @Size(max = 128, message = "Password must not exceed 128 characters")
        String password,

        @Size(max = 255, message = "Device ID must not exceed 255 characters")
        String deviceId,

        @Size(max = 255, message = "Device name must not exceed 255 characters")
        String deviceName
) {}
