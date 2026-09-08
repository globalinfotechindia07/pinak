package com.superapp.auth.dto;

import com.superapp.common.validation.PasswordPolicy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        @Size(max = 128, message = "Password must not exceed 128 characters")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @PasswordPolicy
        String newPassword
) {}
