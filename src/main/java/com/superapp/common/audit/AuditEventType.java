package com.superapp.common.audit;

/**
 * Enumeration of all security-sensitive auditable events.
 * Used to populate audit_logs.event_type.
 * <p>
 * NEVER log: password, OTP, access token, refresh token, JWT secret.
 */
public enum AuditEventType {
    // Authentication
    REGISTER_SUCCESS,
    REGISTER_FAILED,
    LOGIN_SUCCESS,
    LOGIN_FAILED,
    LOGOUT,
    LOGOUT_ALL,

    // Token management
    TOKEN_REFRESH,
    TOKEN_REUSE_DETECTED,
    TOKEN_REVOKED,

    // Password lifecycle
    PASSWORD_CHANGED,
    PASSWORD_RESET_REQUESTED,
    PASSWORD_RESET_SUCCESS,
    PASSWORD_RESET_FAILED,

    // Account lifecycle
    ACCOUNT_BLOCKED,
    ACCOUNT_UNBLOCKED,
    ACCOUNT_DEACTIVATED,
    ACCOUNT_ACTIVATED,
    ACCOUNT_SUSPENDED,

    // Profile & identity updates
    PROFILE_UPDATED,
    EMAIL_CHANGED,
    PHONE_CHANGED,

    // Role & permissions
    ROLE_CHANGED,

    // Session management
    SESSION_REVOKED,

    // Verification
    EMAIL_VERIFICATION_SENT,
    EMAIL_VERIFIED,
    MOBILE_OTP_SENT,
    MOBILE_VERIFIED,

    // Rate limiting
    RATE_LIMIT_EXCEEDED
}
