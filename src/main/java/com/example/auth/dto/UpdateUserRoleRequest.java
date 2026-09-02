package com.example.auth.dto;

import com.example.auth.entity.Role;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for administrative role modification.
 */
public record UpdateUserRoleRequest(
        @NotNull(message = "Role is required (USER or ADMIN)")
        Role role
) {
}
