package com.superapp.common.exception;

import com.superapp.common.response.ApiError;

/**
 * Thrown when an authenticated user attempts an unauthorized action (HTTP 403 Forbidden).
 */
public class ForbiddenException extends AppException {

    public ForbiddenException(String message) {
        super(message, ApiError.FORBIDDEN, 403);
    }
}
