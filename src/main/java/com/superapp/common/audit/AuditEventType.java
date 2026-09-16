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

    // Merchant lifecycle
    MERCHANT_CREATED,
    MERCHANT_UPDATED,
    MERCHANT_KYC_SUBMITTED,
    MERCHANT_APPROVED,
    MERCHANT_REJECTED,
    MERCHANT_SUSPENDED,
    MERCHANT_REACTIVATED,

    // Store lifecycle
    STORE_CREATED,
    STORE_UPDATED,
    STORE_SUBMITTED,
    STORE_APPROVED,
    STORE_REJECTED,
    STORE_SUSPENDED,
    STORE_REACTIVATED,
    STORE_LOCATION_CHANGED,

    // Offer lifecycle
    OFFER_CREATED,
    OFFER_UPDATED,
    OFFER_SUBMITTED,
    OFFER_APPROVED,
    OFFER_REJECTED,
    OFFER_EXPIRED,
    OFFER_DEACTIVATED,

    // Master Data (Category & Location)
    CATEGORY_CREATED,
    CATEGORY_UPDATED,
    CATEGORY_DEACTIVATED,
    CITY_CREATED,
    CITY_UPDATED,
    CITY_DEACTIVATED,

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
    RATE_LIMIT_EXCEEDED,

    // Payment & Transaction lifecycle
    PAYMENT_INITIATED,
    PAYMENT_PENDING,
    PAYMENT_SUCCESS,
    PAYMENT_FAILED,
    PAYMENT_REFUNDED,
    PAYMENT_CANCELLED,

    // Webhook lifecycle
    WEBHOOK_RECEIVED,
    WEBHOOK_VERIFIED,
    WEBHOOK_REJECTED,

    // Redemption lifecycle
    REDEMPTION_INITIATED,
    REDEMPTION_SUCCESS,
    REDEMPTION_FAILED,
    REDEMPTION_CANCELLED,
    REDEMPTION_LIMIT_REACHED,
    DUPLICATE_REDEMPTION_ATTEMPT,

    // Reward lifecycle
    REWARD_CREDITED,
    REWARD_DEBITED,
    REWARD_REVERSED,
    REWARD_ADJUSTED,

    // Notification lifecycle
    NOTIFICATION_CREATED,
    NOTIFICATION_READ,
    NOTIFICATION_ALL_READ,
    NOTIFICATION_PREFERENCES_UPDATED
}
