package com.example.auth.dto;

/**
 * DTO returned after successful authentication containing JWT access token.
 */
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn
) {
    public static AuthResponse bearer(String accessToken, long expiresInSeconds) {
        return new AuthResponse(accessToken, "Bearer", expiresInSeconds);
    }
}
