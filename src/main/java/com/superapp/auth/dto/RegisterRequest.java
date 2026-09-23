package com.superapp.auth.dto;

import com.superapp.common.validation.PasswordPolicy;
import com.superapp.user.entity.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

/**
 * Request body for user registration (Customer, Merchant, or Admin).
 * Includes confirmPassword to verify password entry consistency.
 * Profile picture can only be provided during registration.
 * Role defaults to CUSTOMER if omitted.
 */
public record RegisterRequest(
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

        @Schema(description = "Confirmation password (must match password)", example = "Password@123")
        String confirmPassword,

        @Schema(description = "Profile picture URL (optional, settable only during registration)", example = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400")
        @Size(max = 1024, message = "Profile picture URL must not exceed 1024 characters")
        String profilePictureUrl,

        @Schema(description = "Account role: CUSTOMER, MERCHANT, or ADMIN (defaults to CUSTOMER if omitted)", example = "CUSTOMER")
        Role role
) {
    // Overloaded constructors for backward compatibility with existing tests
    public RegisterRequest(String firstName, String lastName, String email, String mobile, String password) {
        this(firstName, lastName, email, mobile, password, password, null, null);
    }

    public RegisterRequest(String firstName, String lastName, String email, String mobile, String password, String profilePictureUrl) {
        this(firstName, lastName, email, mobile, password, password, profilePictureUrl, null);
    }

    public RegisterRequest(String firstName, String lastName, String email, String mobile, String password, String profilePictureUrl, Role role) {
        this(firstName, lastName, email, mobile, password, password, profilePictureUrl, role);
    }
}
