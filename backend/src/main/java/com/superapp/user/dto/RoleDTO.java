package com.superapp.user.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Consolidated Role Data Transfer Objects (Single File per Table Architecture)
 */
public class RoleDTO {

    /**
     * DTO for returning role information to clients (Admin, Merchant, Store consoles)
     */
    public record Response(
            String id,
            String scope,
            UUID scopeId,
            String name,
            String description,
            String badgeCls,
            boolean isSystem,
            String permissions,
            UUID createdBy,
            Instant createdAt,
            Instant updatedAt
    ) {}

    /**
     * DTO for creating a new role (Platform custom role, Merchant custom role, or Store role)
     */
    public record CreateRequest(
            @jakarta.validation.constraints.NotBlank(message = "Role ID is required")
            @jakarta.validation.constraints.Pattern(regexp = "^[A-Z0-9_]{3,50}$", message = "Role ID must be uppercase alphanumeric and underscores (3-50 chars)")
            String id,

            @jakarta.validation.constraints.NotBlank(message = "Scope is required")
            String scope,

            UUID scopeId,

            @jakarta.validation.constraints.NotBlank(message = "Role name is required")
            @jakarta.validation.constraints.Size(min = 2, max = 50, message = "Role name must be between 2 and 50 characters")
            String name,

            String description,
            String badgeCls,
            String permissions
    ) {}

    /**
     * DTO for updating an existing role
     */
    public record UpdateRequest(
            String name,
            String description,
            String badgeCls,
            String permissions
    ) {}
}
