package com.superapp.auth.dto;

import com.superapp.common.validation.PasswordPolicy;
import com.superapp.common.validation.PasswordsMatch;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for POST /auth/change-password.
 * All three fields are required.
 * {@code newPassword} and {@code confirmNewPassword} must match.
 */
@PasswordsMatch(
        field = "newPassword",
        matchField = "confirmNewPassword",
        message = "New password and confirmation password do not match"
)
public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        @Size(max = 128, message = "Password must not exceed 128 characters")
        @Schema(description = "Your current (existing) password", example = "Customer@123456")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @PasswordPolicy
        @Schema(description = "New password (min 8 chars, upper + lower + digit + special)", example = "Customer@NewPass99")
        String newPassword,

        @NotBlank(message = "Please confirm your new password")
        @Size(max = 128, message = "Password must not exceed 128 characters")
        @Schema(description = "Re-enter new password to confirm", example = "Customer@NewPass99")
        String confirmNewPassword
) {}
