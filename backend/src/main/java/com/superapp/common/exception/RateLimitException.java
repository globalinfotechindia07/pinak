package com.superapp.common.exception;

import com.superapp.common.response.ApiError;

/** Thrown when a rate limit is exceeded (maps to HTTP 429). */
public class RateLimitException extends AppException {

    public RateLimitException(String message) {
        super(message, ApiError.RATE_LIMIT_EXCEEDED, 429);
    }

    public static RateLimitException tooManyAttempts(String endpoint) {
        return new RateLimitException(
                "Too many requests to " + endpoint + ". Please try again later.");
    }
}
