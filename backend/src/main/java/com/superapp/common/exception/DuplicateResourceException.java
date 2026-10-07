package com.superapp.common.exception;

import com.superapp.common.response.ApiError;

/** Thrown when a unique constraint is violated (maps to HTTP 409). */
public class DuplicateResourceException extends AppException {

    public DuplicateResourceException(String message, ApiError errorCode) {
        super(message, errorCode, 409);
    }

    public DuplicateResourceException(String resource, String field, Object value) {
        super(resource + " with " + field + " '" + value + "' already exists.", ApiError.DUPLICATE_RESOURCE, 409);
    }

    public static DuplicateResourceException email(String email) {
        return new DuplicateResourceException(
                "Email is already in use",
                ApiError.EMAIL_ALREADY_EXISTS);
    }

    public static DuplicateResourceException mobile(String mobile) {
        return new DuplicateResourceException(
                "An account with mobile '" + mobile + "' already exists.",
                ApiError.MOBILE_ALREADY_EXISTS);
    }
}
