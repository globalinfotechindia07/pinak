package com.example.auth.dto;

import com.example.auth.entity.Role;
import com.example.auth.entity.User;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Safe DTO representing user profile information.
 * Ensures internal fields such as password hash are never exposed.
 */
public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        Role role,
        LocalDateTime createdAt
) {
    /**
     * Factory method to map a User JPA entity to a safe UserResponse DTO.
     *
     * @param user User entity
     * @return safe UserResponse DTO
     */
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
