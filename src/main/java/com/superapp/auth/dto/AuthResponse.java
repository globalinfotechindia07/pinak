package com.superapp.auth.dto;

/**
 * Returned after successful login or token refresh.
 */
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        String refreshToken,
        UserSummary user
) {
    public static AuthResponse of(String accessToken, String refreshToken, long expiresIn, UserSummary user) {
        return new AuthResponse(accessToken, "Bearer", expiresIn, refreshToken, user);
    }
}
