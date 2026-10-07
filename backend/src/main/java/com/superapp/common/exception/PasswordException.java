package com.superapp.common.exception;

import com.superapp.common.response.ApiError;

/** Thrown for password-related validation failures. */
public class PasswordException extends AppException {

    public PasswordException(String message, ApiError errorCode) {
        super(message, errorCode, 400);
    }

    public static PasswordException incorrectCurrentPassword() {
        return new PasswordException("Current password is incorrect.", ApiError.CURRENT_PASSWORD_INCORRECT);
    }

    public static PasswordException otpInvalid() {
        return new PasswordException("Invalid or expired OTP.", ApiError.PASSWORD_RESET_OTP_INVALID);
    }

    public static PasswordException otpExpired() {
        return new PasswordException("OTP has expired. Please request a new one.", ApiError.PASSWORD_RESET_OTP_EXPIRED);
    }

    public static PasswordException otpAlreadyUsed() {
        return new PasswordException("OTP has already been used.", ApiError.PASSWORD_RESET_OTP_USED);
    }

    public static PasswordException tooManyAttempts() {
        return new PasswordException("Too many invalid attempts. Please request a new OTP.", ApiError.PASSWORD_RESET_TOO_MANY_ATTEMPTS);
    }
}
