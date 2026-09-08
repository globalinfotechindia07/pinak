package com.superapp.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Schema(description = "Request to send OTP to mobile phone number")
public record SendOtpRequest(
        @Schema(description = "Mobile phone number with country code (e.g. +919876543210 or 10 digits)", example = "+919876543210")
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^\\+?[1-9]\\d{9,14}$", message = "Please enter a valid phone number (10 to 15 digits, optional +)")
        String phone
) {}
