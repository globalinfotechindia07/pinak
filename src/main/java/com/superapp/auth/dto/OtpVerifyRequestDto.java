package com.superapp.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpVerifyRequestDto(
        @NotBlank(message = "Phone number is required")
        String phone,

        @NotBlank(message = "OTP request ID is required")
        String otpRequestId,

        @NotBlank(message = "OTP code is required")
        @Pattern(regexp = "^[0-9]{4,8}$", message = "Invalid OTP format")
        String otp,

        String deviceId
) {}
