package com.superapp.common.exception;

import com.superapp.common.response.ApiError;

/** Thrown when a requested resource cannot be found (maps to HTTP 404). */
public class ResourceNotFoundException extends AppException {

    public ResourceNotFoundException(String message) {
        super(message, ApiError.RESOURCE_NOT_FOUND, 404);
    }

    public static ResourceNotFoundException user(String identifier) {
        return new ResourceNotFoundException("User not found: " + identifier);
    }

    public static ResourceNotFoundException session(String sessionId) {
        return new ResourceNotFoundException("Session not found: " + sessionId);
    }
}
