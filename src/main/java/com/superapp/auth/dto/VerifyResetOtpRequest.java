package com.superapp.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyResetOtpRequest(
        @NotBlank(message = "Identifier (email or mobile) is required")
        String identifier,

        @NotBlank(message = "OTP is required")
        @Size(min = 4, max = 10, message = "Invalid OTP format")
        String otp
) {}
