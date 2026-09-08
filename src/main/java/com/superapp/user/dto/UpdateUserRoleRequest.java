package com.superapp.user.dto;

import com.superapp.user.entity.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull(message = "Role is required")
        Role role
) {}
