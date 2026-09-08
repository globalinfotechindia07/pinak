package com.superapp.auth.dto;

import com.superapp.user.entity.User;

/**
 * Safe user information included in auth responses.
 * Never includes: password, passwordHash, tokens, internal security data.
 */
public record UserSummary(
        String id,
        String name,
        String email,
        String mobile,
        String role,
        String status,
        boolean emailVerified,
        boolean mobileVerified,
        String profilePictureUrl
) {
    public static UserSummary from(User user) {
        return new UserSummary(
                user.getId().toString(),
                user.getName(),
                user.getEmail(),
                user.getMobile(),
                user.getRole().name(),
                user.getStatus().name(),
                user.isEmailVerified(),
                user.isMobileVerified(),
                user.getProfilePictureUrl()
        );
    }

    public UserSummary(String id, String name, String email, String mobile,
                       String role, String status, boolean emailVerified, boolean mobileVerified) {
        this(id, name, email, mobile, role, status, emailVerified, mobileVerified, null);
    }
}
