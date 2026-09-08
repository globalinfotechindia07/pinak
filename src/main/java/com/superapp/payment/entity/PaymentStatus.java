package com.superapp.payment.entity;

/**
 * Payment lifecycle statuses.
 * Flow: INITIATED -> PENDING -> SUCCESS (or FAILED) -> REFUNDED
 */
public enum PaymentStatus {
    /** Payment record created and payment intent initiated with provider. */
    INITIATED,
    /** Payment is in-flight awaiting confirmation / webhook / user action. */
    PENDING,
    /** Payment confirmed successful and verified. */
    SUCCESS,
    /** Payment transaction failed, declined, or timed out. */
    FAILED,
    /** Successfully processed full or partial refund. */
    REFUNDED
}
