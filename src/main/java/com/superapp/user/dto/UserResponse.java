package com.superapp.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.superapp.user.entity.User;

import java.time.Instant;

/**
 * Full user profile DTO — returned from user management endpoints.
 * Never includes: password, tokens, internal security data.
 */
public record UserResponse(
        String id,
        String name,
        String firstName,
        String lastName,
        String email,
        String mobile,
        String role,
        String status,
        boolean emailVerified,
        boolean mobileVerified,
        String profilePictureUrl,
        Instant createdAt,
        Instant updatedAt
) {
    @JsonProperty("phone")
    public String phone() {
        return mobile;
    }

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId().toString(),
                user.getName(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getMobile(),
                user.getRole().name(),
                user.getStatus().name(),
                user.isEmailVerified(),
                user.isMobileVerified(),
                user.getProfilePictureUrl(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public UserResponse(String id, String name, String firstName, String lastName,
                        String email, String mobile, String role, String status,
                        boolean emailVerified, boolean mobileVerified,
                        Instant createdAt, Instant updatedAt) {
        this(id, name, firstName, lastName, email, mobile, role, status,
                emailVerified, mobileVerified, null, createdAt, updatedAt);
    }
}
