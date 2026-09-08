package com.superapp.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForgotPasswordRequest(
        @NotBlank(message = "Identifier (email or mobile) is required")
        @Size(max = 255, message = "Identifier must not exceed 255 characters")
        String identifier
) {}
