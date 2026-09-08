package com.superapp.auth.dto;

import com.superapp.common.validation.PasswordPolicy;
import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(
        @NotBlank(message = "Reset token is required")
        String resetToken,

        @NotBlank(message = "New password is required")
        @PasswordPolicy
        String newPassword
) {}
