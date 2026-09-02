package com.example.auth.exception;

/**
 * Exception thrown when attempting to create a resource with a unique constraint violation (e.g. duplicate email).
 */
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
