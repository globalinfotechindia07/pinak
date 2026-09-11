package com.superapp.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.slf4j.MDC;

/**
 * Unified API response envelope used across all endpoints.
 * <p>
 * Success:
 * <pre>{ "success": true, "message": "...", "data": {...}, "meta": {...}, "requestId": "..." }</pre>
 * <p>
 * Error:
 * <pre>{ "success": false, "message": "...", "error": { "code": "...", "details": null }, "requestId": "..." }</pre>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String message,
        String errorCode,
        T data,
        ApiErrorDetails error,
        PaginationMeta meta,
        String requestId
) {
    // 6-arg constructor for standard non-paginated responses
    public ApiResponse(boolean success, String message, String errorCode, T data, ApiErrorDetails error, String requestId) {
        this(success, message, errorCode, data, error, null, requestId);
    }

    /** Factory for successful responses with data. */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, null, data, null, null, currentRequestId());
    }

    /** Factory for successful responses with paginated data and metadata. */
    public static <T> ApiResponse<T> success(String message, T data, PaginationMeta meta) {
        return new ApiResponse<>(true, message, null, data, null, meta, currentRequestId());
    }

    /** Factory for successful responses without data (e.g., logout, delete). */
    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null, null, null, null, currentRequestId());
    }

    /** Factory for error responses with code. */
    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return new ApiResponse<>(false, message, errorCode, null, ApiErrorDetails.of(errorCode), null, currentRequestId());
    }

    /** Factory for error responses with code and details. */
    public static <T> ApiResponse<T> error(String message, String errorCode, Object details) {
        return new ApiResponse<>(false, message, errorCode, null, ApiErrorDetails.of(errorCode, details), null, currentRequestId());
    }

    private static String currentRequestId() {
        return MDC.get("requestId");
    }

    // 4-arg constructor for backward compatibility
    @SuppressWarnings("unchecked")
    public ApiResponse(boolean success, String message, String errorCode, T data) {
        this(success, message, errorCode, data,
                errorCode != null ? ApiErrorDetails.of(errorCode, data instanceof java.util.Map || data instanceof java.util.List ? data : null) : null,
                null,
                currentRequestId());
    }
}
