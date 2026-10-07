package com.superapp.common.exception;

import com.superapp.common.response.ApiError;

/**
 * Thrown when a suspended or blocked user attempts to access protected endpoints.
 * Returns HTTP 403 with code USER_SUSPENDED.
 */
public class UserSuspendedException extends AppException {

    public UserSuspendedException() {
        super("User account is suspended", ApiError.USER_SUSPENDED, 403);
    }

    public UserSuspendedException(String message) {
        super(message, ApiError.USER_SUSPENDED, 403);
    }
}
