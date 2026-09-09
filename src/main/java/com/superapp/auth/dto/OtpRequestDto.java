package com.superapp.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpRequestDto(
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^[+]?[0-9]{7,20}$", message = "Invalid phone number format")
        String phone,

        String purpose,

        String deviceId
) {}
