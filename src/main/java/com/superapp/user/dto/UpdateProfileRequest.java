package com.superapp.user.dto;

import com.superapp.user.validation.ValidName;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body for updating authenticated user profile.
 * ALL fields are optional — only non-null/non-blank fields will be applied.
 * Updatable: firstName, lastName, email, mobile, profilePictureUrl.
 * NOT updatable here: role, status, password, security fields.
 */
public record UpdateProfileRequest(
        @Size(max = 100, message = "First name must not exceed 100 characters")
        @ValidName(message = "First name contains invalid characters")
        @Schema(description = "First name (optional)", example = "Jane")
        String firstName,

        @Size(max = 100, message = "Last name must not exceed 100 characters")
        @ValidName(message = "Last name contains invalid characters")
        @Schema(description = "Last name (optional)", example = "Doe")
        String lastName,

        @Email(message = "Invalid email address")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        @Schema(description = "Email address (optional)", example = "jane.doe@example.com")
        String email,

        @Pattern(regexp = "^[+]?[0-9]{7,20}$", message = "Invalid mobile number format")
        @Size(min = 7, max = 20, message = "Mobile number must be between 7 and 20 characters")
        @Schema(description = "Mobile / phone number (optional)", example = "+919876543210")
        String mobile,

        @Size(max = 1024, message = "Profile picture URL must not exceed 1024 characters")
        @Schema(description = "Profile picture URL (optional)", example = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400")
        String profilePictureUrl
) {
    // 3-arg constructor for backward compatibility with existing tests
    public UpdateProfileRequest(String firstName, String lastName, String email) {
        this(firstName, lastName, email, null, null);
    }

    // 4-arg constructor for backward compatibility with existing tests
    public UpdateProfileRequest(String firstName, String lastName, String email, String mobile) {
        this(firstName, lastName, email, mobile, null);
    }
}
