package com.example.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Standardized success response envelope returned across all REST endpoints.
 * Provides consistent response schema alongside ErrorResponse.
 *
 * @param <T> type of data payload
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SuccessResponse<T>(
        Instant timestamp,
        int status,
        String message,
        T data
) {
    public SuccessResponse(int status, String message, T data) {
        this(Instant.now(), status, message, data);
    }

    public SuccessResponse(int status, String message) {
        this(Instant.now(), status, message, null);
    }

    public static <T> SuccessResponse<T> of(int status, String message, T data) {
        return new SuccessResponse<>(status, message, data);
    }

    public static <T> SuccessResponse<T> ok(String message, T data) {
        return new SuccessResponse<>(200, message, data);
    }

    public static <T> SuccessResponse<T> ok(String message) {
        return new SuccessResponse<>(200, message, null);
    }

    public static <T> SuccessResponse<T> created(String message, T data) {
        return new SuccessResponse<>(201, message, data);
    }
}
