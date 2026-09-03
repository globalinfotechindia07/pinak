package com.example.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for requesting a new access token using a valid refresh token.
 */
public record RefreshTokenRequest(
        @NotBlank(message = "Refresh token is required")
        String refreshToken
) {
}
