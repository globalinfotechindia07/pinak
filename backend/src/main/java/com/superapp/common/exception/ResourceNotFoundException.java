package com.superapp.common.exception;

import com.superapp.common.response.ApiError;

/** Thrown when a requested resource cannot be found (maps to HTTP 404). */
public class ResourceNotFoundException extends AppException {

    public ResourceNotFoundException(String message) {
        super(message, ApiError.RESOURCE_NOT_FOUND, 404);
    }

    public ResourceNotFoundException(String message, ApiError errorCode) {
        super(message, errorCode, 404);
    }

    public ResourceNotFoundException(String resource, String field, Object value) {
        super(resource + " not found with " + field + ": " + value, ApiError.RESOURCE_NOT_FOUND, 404);
    }

    public static ResourceNotFoundException user() {
        return new ResourceNotFoundException("User not found", ApiError.USER_NOT_FOUND);
    }

    public static ResourceNotFoundException user(String identifier) {
        return new ResourceNotFoundException("User not found", ApiError.USER_NOT_FOUND);
    }

    public static ResourceNotFoundException session(String sessionId) {
        return new ResourceNotFoundException("Session not found: " + sessionId, ApiError.SESSION_NOT_FOUND);
    }
}
