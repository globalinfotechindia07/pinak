package com.example.auth.exception;

/**
 * Exception thrown when a requested resource (e.g. User by ID or Email) does not exist.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
