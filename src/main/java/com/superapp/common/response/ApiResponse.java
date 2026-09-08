package com.superapp.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Unified API response envelope used across all endpoints.
 * <p>
 * Success:
 * <pre>{ "success": true, "message": "Operation successful", "data": {...} }</pre>
 * <p>
 * Error:
 * <pre>{ "success": false, "message": "Something went wrong", "errorCode": "ERROR_CODE", "data": null }</pre>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String message,
        String errorCode,
        T data
) {
    /** Factory for successful responses with data. */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, null, data);
    }

    /** Factory for successful responses without data (e.g., logout, delete). */
    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null, null);
    }

    /** Factory for error responses. */
    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return new ApiResponse<>(false, message, errorCode, null);
    }
}
