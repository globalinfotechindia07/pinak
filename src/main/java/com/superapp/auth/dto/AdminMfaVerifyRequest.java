package com.superapp.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AdminMfaVerifyRequest(
        @NotBlank(message = "Challenge ID is required")
        String challengeId,

        @NotBlank(message = "MFA code is required")
        @Pattern(regexp = "^[0-9]{6}$", message = "MFA code must be 6 digits")
        String code,

        String deviceId
) {}
