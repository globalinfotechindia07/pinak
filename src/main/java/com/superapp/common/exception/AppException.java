package com.superapp.common.exception;

import com.superapp.common.response.ApiError;

/**
 * Base application runtime exception.
 * All custom exceptions extend this class for consistent handling in GlobalExceptionHandler.
 */
public class AppException extends RuntimeException {

    private final ApiError errorCode;
    private final int httpStatus;

    public AppException(String message, ApiError errorCode, int httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public AppException(String message, ApiError errorCode, int httpStatus, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public ApiError getErrorCode() { return errorCode; }
    public int getHttpStatus() { return httpStatus; }
}
