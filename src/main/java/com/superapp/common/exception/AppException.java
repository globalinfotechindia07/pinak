package com.superapp.common.exception;

import com.superapp.common.response.ApiError;

/**
 * Base application runtime exception.
 * All custom exceptions extend this class for consistent handling in GlobalExceptionHandler.
 */
public class AppException extends RuntimeException {

    private final ApiError errorCode;
    private final int httpStatus;
    private final Object details;

    public AppException(String message, ApiError errorCode, int httpStatus) {
        this(message, errorCode, httpStatus, (Object) null);
    }

    public AppException(String message, ApiError errorCode, int httpStatus, Object details) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
        this.details = details;
    }

    public AppException(String message, ApiError errorCode, int httpStatus, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
        this.details = null;
    }

    public ApiError getErrorCode() { return errorCode; }
    public int getHttpStatus() { return httpStatus; }
    public Object getDetails() { return details; }
}
