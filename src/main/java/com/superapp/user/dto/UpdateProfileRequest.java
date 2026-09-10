package com.superapp.user.dto;

import com.superapp.user.validation.ValidName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * Request body for updating authenticated user profile.
 * Only firstName, lastName, and email are permitted.
 * Phone number, role, status, and sensitive security fields cannot be updated here.
 */
public record UpdateProfileRequest(
        @Size(max = 100, message = "First name must not exceed 100 characters")
        @ValidName(message = "First name contains invalid characters")
        String firstName,

        @Size(max = 100, message = "Last name must not exceed 100 characters")
        @ValidName(message = "Last name contains invalid characters")
        String lastName,

        @Email(message = "Invalid email address")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        String email
) {
    // 4-arg constructor for backward compatibility with existing tests; mobile is ignored
    public UpdateProfileRequest(String firstName, String lastName, String email, String mobile) {
        this(firstName, lastName, email);
    }
}
