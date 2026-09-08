package com.superapp.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body for updating user profile.
 * Email and role cannot be changed here (separate controlled flows).
 */
public record UpdateProfileRequest(
        @Size(max = 100, message = "First name must not exceed 100 characters")
        String firstName,

        @Size(max = 100, message = "Last name must not exceed 100 characters")
        String lastName,

        @Size(min = 7, max = 20, message = "Mobile number must be between 7 and 20 characters")
        @Pattern(regexp = "^[+]?[0-9]{7,20}$", message = "Invalid mobile number format")
        String mobile
) {}
