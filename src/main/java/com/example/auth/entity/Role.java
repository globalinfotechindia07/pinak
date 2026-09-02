package com.example.auth.entity;

/**
 * Represents the authorization roles assigned to users in the system.
 * Stored as a VARCHAR string in the database (@Enumerated(EnumType.STRING)).
 */
public enum Role {
    USER,
    ADMIN
}
