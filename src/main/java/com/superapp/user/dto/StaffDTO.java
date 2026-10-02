package com.superapp.user.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Consolidated Staff Data Transfer Objects (Single File per Table Architecture)
 */
public class StaffDTO {

    /**
     * DTO for returning staff member information across Admin, Merchant, and Store portals
     */
    public record Response(
            UUID id,
            UUID userId,
            String name,
            String email,
            String phone,
            String roleId,
            String roleName,
            String scope,
            UUID merchantId,
            String merchantName,
            UUID storeId,
            String storeName,
            String status,
            String customPermissions,
            Instant lastLoginAt,
            Instant createdAt,
            String inviteUrl
    ) {
        public Response(UUID id, UUID userId, String name, String email, String phone,
                        String roleId, String roleName, String scope, UUID merchantId,
                        String merchantName, UUID storeId, String storeName, String status,
                        String customPermissions, Instant lastLoginAt, Instant createdAt) {
            this(id, userId, name, email, phone, roleId, roleName, scope, merchantId,
                    merchantName, storeId, storeName, status, customPermissions,
                    lastLoginAt, createdAt, null);
        }
    }

    /**
     * DTO for inviting or registering a new staff member at Platform, Merchant, or Store scope
     */
    public record InviteRequest(
            String email,
            String name,
            String phone,
            String roleId,
            String scope,
            UUID merchantId,
            UUID storeId,
            String posPin,
            String customPermissions
    ) {}

    /**
     * DTO for verifying an invitation link
     */
    public record VerifyInviteResponse(
            String name,
            String email,
            String roleId,
            String roleName,
            String scope
    ) {}

    /**
     * DTO for completing invitation onboarding and setting initial secure password
     */
    public record AcceptInviteRequest(
            @jakarta.validation.constraints.NotBlank(message = "Token is required") String token,
            @jakarta.validation.constraints.NotBlank(message = "Password is required")
            @jakarta.validation.constraints.Size(min = 8, message = "Password must be at least 8 characters") String password
    ) {}

    /**
     * DTO for updating a staff member's active/suspended status
     */
    public record UpdateStatusRequest(
            String status
    ) {}

    /**
     * DTO for updating a staff member's assigned role
     */
    public record UpdateRoleRequest(
            String roleId,
            String customPermissions
    ) {}

    /**
     * DTO for fast POS counter terminal PIN verification (for Store Cashiers)
     */
    public record VerifyPosPinRequest(
            UUID storeId,
            String phone,
            String posPin
    ) {}
}
