package com.superapp.common.exception;

import com.superapp.common.response.ApiError;
import com.superapp.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler — converts all exceptions to consistent ApiResponse format.
 * <p>
 * NEVER exposes: stack traces, SQL queries, Java class names, server paths,
 * JWT information, or internal infrastructure details.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ---- Application exceptions ----

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<?>> handleAppException(AppException ex, HttpServletRequest request) {
        log.warn("AppException [{}] on {}: {}", ex.getErrorCode(), request.getRequestURI(), ex.getMessage());
        return ResponseEntity
                .status(ex.getHttpStatus())
                .body(ApiResponse.error(ex.getMessage(), ex.getErrorCode().name(), ex.getDetails()));
    }

    // ---- Spring Security exceptions ----

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<?>> handleBadCredentials(BadCredentialsException ex, HttpServletRequest req) {
        log.warn("BadCredentials on {}", req.getRequestURI());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid credentials", ApiError.INVALID_CREDENTIALS.name()));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiResponse<?>> handleLocked(LockedException ex, HttpServletRequest req) {
        log.warn("Account locked on {}", req.getRequestURI());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Your account has been blocked. Please contact support.",
                        ApiError.ACCOUNT_BLOCKED.name()));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiResponse<?>> handleDisabled(DisabledException ex, HttpServletRequest req) {
        log.warn("Account disabled on {}", req.getRequestURI());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Your account is inactive. Please contact support.",
                        ApiError.ACCOUNT_INACTIVE.name()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        log.warn("Access denied on {} for {}", req.getRequestURI(), req.getRemoteUser());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("You do not have permission to perform this action",
                        ApiError.FORBIDDEN.name()));
    }

    // ---- Validation exceptions ----

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest req) {

        java.util.List<Map<String, String>> details = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(fe -> Map.of(
                        "field", fe.getField(),
                        "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value"
                ))
                .toList();

        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                        (a, b) -> a // keep first error per field
                ));

        log.debug("Validation failed on {}: {}", req.getRequestURI(), fieldErrors);

        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                false, "Validation failed", ApiError.VALIDATION_FAILED.name(), fieldErrors,
                com.superapp.common.response.ApiErrorDetails.of("VALIDATION_ERROR", details),
                org.slf4j.MDC.get("requestId")
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<?>> handleMalformedJson(HttpMessageNotReadableException ex, HttpServletRequest req) {
        log.debug("Malformed JSON on {}: {}", req.getRequestURI(), ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Malformed request body", ApiError.VALIDATION_FAILED.name()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNoResource(NoResourceFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Resource not found", ApiError.RESOURCE_NOT_FOUND.name()));
    }

    // ---- Catch-all (never expose internals) ----

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleUnexpected(Exception ex, HttpServletRequest request) {
        // Log with full stack trace internally, but NEVER expose it in the response
        log.error("Unexpected error on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred. Please try again later.",
                        ApiError.INTERNAL_SERVER_ERROR.name()));
    }
}
