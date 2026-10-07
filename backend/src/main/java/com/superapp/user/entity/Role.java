package com.superapp.user.entity;

/**
 * Application roles.
 * Role is always sourced from the database/security context — never trusted from the frontend.
 */
public enum Role {
    /** Platform administrator: full system access. */
    ADMIN,
    /** Merchant: manages business profile, stores, offers, transactions. */
    MERCHANT,
    /** End customer: discovers stores, redeems offers, earns rewards, pays. */
    CUSTOMER,

    // Legacy / alias compatibility
    SUPER_ADMIN,
    VENDOR
}
