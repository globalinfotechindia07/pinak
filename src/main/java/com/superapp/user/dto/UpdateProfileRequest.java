package com.superapp.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body for updating user profile.
 * Only firstName, lastName, and email are permitted.
 * Role, status, and sensitive security fields cannot be updated here.
 */
public record UpdateProfileRequest(
        @Size(max = 100, message = "First name must not exceed 100 characters")
        String firstName,

        @Size(max = 100, message = "Last name must not exceed 100 characters")
        String lastName,

        @Email(message = "Invalid email format")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        String email,

        @Size(min = 7, max = 20, message = "Mobile number must be between 7 and 20 characters")
        @Pattern(regexp = "^[+]?[0-9]{7,20}$", message = "Invalid mobile number format")
        String mobile
) {
    public UpdateProfileRequest(String firstName, String lastName, String email) {
        this(firstName, lastName, email, null);
    }
}
