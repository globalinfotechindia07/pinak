package com.example.auth.dto;

/**
 * DTO returned after successful authentication or token refresh containing
 * the short-lived access token and the long-lived refresh token.
 */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn
) {
    public static AuthResponse of(String accessToken, String refreshToken, long expiresInSeconds) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresInSeconds);
    }

    public static AuthResponse bearer(String accessToken, long expiresInSeconds) {
        return new AuthResponse(accessToken, null, "Bearer", expiresInSeconds);
    }
}

