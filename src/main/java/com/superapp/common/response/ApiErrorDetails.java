package com.superapp.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Encapsulates machine-readable error code and detailed field errors.
 */
@JsonInclude(JsonInclude.Include.ALWAYS)
public record ApiErrorDetails(
        String code,
        Object details
) {
    public static ApiErrorDetails of(String code) {
        return new ApiErrorDetails(code, null);
    }

    public static ApiErrorDetails of(String code, Object details) {
        return new ApiErrorDetails(code, details);
    }
}
