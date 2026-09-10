package com.superapp.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.superapp.user.entity.User;

import java.time.Instant;

/**
 * User profile DTO — returned from user management endpoints.
 * Never includes: password, tokens, internal security data.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserResponse(
        String id,
        String phone,
        String email,
        String firstName,
        String lastName,
        String role,
        String status,
        boolean profileCompleted,
        String name,
        String mobile,
        Boolean emailVerified,
        Boolean mobileVerified,
        String profilePictureUrl,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId().toString(),
                user.getPhone(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getStatus() != null ? user.getStatus().name() : null,
                user.isProfileCompleted(),
                user.getName(),
                user.getMobile(),
                user.isEmailVerified(),
                user.isMobileVerified(),
                user.getProfilePictureUrl(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    // Backward-compatible constructor for previous tests & callers
    public UserResponse(String id, String name, String firstName, String lastName,
                        String email, String mobile, String role, String status,
                        boolean emailVerified, boolean mobileVerified,
                        String profilePictureUrl, Instant createdAt, Instant updatedAt) {
        this(id, mobile, email, firstName, lastName, role, status,
                (firstName != null && !firstName.isBlank() && lastName != null && !lastName.isBlank() && email != null && !email.isBlank()),
                name, mobile, emailVerified, mobileVerified, profilePictureUrl, createdAt, updatedAt);
    }

    public UserResponse(String id, String name, String firstName, String lastName,
                        String email, String mobile, String role, String status,
                        boolean emailVerified, boolean mobileVerified,
                        Instant createdAt, Instant updatedAt) {
        this(id, name, firstName, lastName, email, mobile, role, status,
                emailVerified, mobileVerified, null, createdAt, updatedAt);
    }
}
