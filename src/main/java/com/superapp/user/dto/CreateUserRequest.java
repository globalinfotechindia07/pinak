package com.superapp.user.dto;

import com.superapp.common.validation.PasswordPolicy;
import com.superapp.user.entity.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

/**
 * Request body for Admin user creation.
 * Supports creating CUSTOMER, MERCHANT, or ADMIN accounts with an initial profile picture.
 */
@Schema(description = "Request body for Admin user creation")
public record CreateUserRequest(
        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name must not exceed 100 characters")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 100, message = "Last name must not exceed 100 characters")
        String lastName,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        String email,

        @Size(min = 7, max = 20, message = "Mobile number must be between 7 and 20 characters")
        @Pattern(regexp = "^[+]?[0-9]{7,20}$", message = "Invalid mobile number format")
        String mobile,

        @NotBlank(message = "Password is required")
        @PasswordPolicy
        String password,

        @NotNull(message = "Role is required")
        @Schema(description = "User role", example = "MERCHANT")
        Role role,

        @Schema(description = "Profile picture URL (optional, settable only during creation)", example = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400")
        @Size(max = 1024, message = "Profile picture URL must not exceed 1024 characters")
        String profilePictureUrl
) {}
