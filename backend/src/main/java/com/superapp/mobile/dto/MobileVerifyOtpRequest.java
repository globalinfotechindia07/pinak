package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request payload to verify mobile OTP")
public record MobileVerifyOtpRequest(
        @NotBlank(message = "Phone number is compulsory")
        @Schema(description = "Customer mobile number (10 digits or E.164 +91)", example = "+919876543210")
        String phone,

        @NotBlank(message = "OTP is compulsory")
        @Schema(description = "6-digit verification code", example = "123456")
        String otp,

        @Schema(description = "Challenge session ID received from send-otp", example = "otp_sess_a81d4e2b")
        String sessionId
) {}
