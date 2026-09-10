package com.superapp.common.response;

/**
 * Machine-readable error codes for all application exceptions.
 * Frontend and mobile apps should use these codes for localization.
 */
public enum ApiError {
    // Auth
    INVALID_CREDENTIALS,
    INVALID_OTP,
    INVALID_TOKEN,
    ACCOUNT_BLOCKED,
    ACCOUNT_INACTIVE,
    TOKEN_EXPIRED,
    TOKEN_INVALID,
    TOKEN_REVOKED,
    TOKEN_REUSE_DETECTED,
    UNAUTHORIZED,
    FORBIDDEN,
    REFRESH_TOKEN_INVALID,

    // Registration / User
    EMAIL_ALREADY_EXISTS,
    MOBILE_ALREADY_EXISTS,
    USER_NOT_FOUND,
    USER_SUSPENDED,
    SESSION_NOT_FOUND,

    // Password
    CURRENT_PASSWORD_INCORRECT,
    PASSWORD_RESET_OTP_INVALID,
    PASSWORD_RESET_OTP_EXPIRED,
    PASSWORD_RESET_OTP_USED,
    PASSWORD_RESET_TOO_MANY_ATTEMPTS,
    WEAK_PASSWORD,

    // Rate limiting
    RATE_LIMIT_EXCEEDED,

    // Validation
    VALIDATION_FAILED,
    VALIDATION_ERROR,

    // General
    RESOURCE_NOT_FOUND,
    DUPLICATE_RESOURCE,
    INTERNAL_SERVER_ERROR,
    SERVICE_UNAVAILABLE
}
