package com.superapp.common.exception;

import com.superapp.common.response.ApiError;

/** Thrown when authentication credentials are invalid or account is not accessible. */
public class AuthException extends AppException {

    public AuthException(String message, ApiError errorCode) {
        super(message, errorCode, 401);
    }

    public static AuthException invalidCredentials() {
        return new AuthException("Invalid credentials", ApiError.INVALID_CREDENTIALS);
    }

    public static AuthException invalidCredentials(String message) {
        return new AuthException(message, ApiError.INVALID_CREDENTIALS);
    }

    public static AuthException accountBlocked() {
        return new AuthException("Your account has been blocked. Please contact support.", ApiError.ACCOUNT_BLOCKED);
    }

    public static AuthException accountSuspended() {
        return new AuthException("Your account has been suspended. Please contact your platform administrator.", ApiError.ACCOUNT_BLOCKED);
    }

    public static AuthException accountSuspended(String message) {
        return new AuthException(message, ApiError.ACCOUNT_BLOCKED);
    }

    public static AuthException accountInactive() {
        return new AuthException("Your account is inactive. Please contact support.", ApiError.ACCOUNT_INACTIVE);
    }

    public static AuthException tokenExpired() {
        return new AuthException("Token has expired", ApiError.TOKEN_EXPIRED);
    }

    public static AuthException tokenInvalid() {
        return new AuthException("Token is invalid", ApiError.TOKEN_INVALID);
    }

    public static AuthException tokenRevoked() {
        return new AuthException("Token has been revoked", ApiError.TOKEN_REVOKED);
    }

    public static AuthException refreshTokenInvalid() {
        return new AuthException("Refresh token is invalid or expired", ApiError.REFRESH_TOKEN_INVALID);
    }

    public static AuthException tokenReuseDetected() {
        return new AuthException(
                "Security alert: Token reuse detected. All sessions have been revoked. Please log in again.",
                ApiError.TOKEN_REUSE_DETECTED);
    }
}
