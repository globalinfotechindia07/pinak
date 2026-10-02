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
            String id,
            String scope,
            UUID scopeId,
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
