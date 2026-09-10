package com.superapp.merchant.entity;

/**
 * Onboarding and approval lifecycle for Merchants and Stores.
 */
public enum ApprovalStatus {
    DRAFT,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,

    // Backward compatibility alias for existing records/tests
    PENDING
}
