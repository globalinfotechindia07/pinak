package com.superapp.user.entity;

/**
 * Lifecycle status of a user account.
 * <ul>
 *   <li>ACTIVE   — Normal, can authenticate and use the application.</li>
 *   <li>INACTIVE — Soft-deactivated; cannot authenticate until re-activated.</li>
 *   <li>BLOCKED  — Locked out due to policy violation or admin action;
 *                  returns controlled 403 on login attempt.</li>
 * </ul>
 */
public enum UserStatus {
    ACTIVE,
    INACTIVE,
    BLOCKED
}
