package com.superapp.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyOtpRequest(
        @NotBlank(message = "OTP is required")
        @Size(min = 4, max = 10, message = "Invalid OTP format")
        String otp
) {}
