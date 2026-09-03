package com.example.auth.controller;

import com.example.auth.config.OpenApiConfig;
import com.example.auth.dto.AdminDashboardStats;
import com.example.auth.dto.SuccessResponse;
import com.example.auth.dto.UpdateUserRoleRequest;
import com.example.auth.dto.UserResponse;
import com.example.auth.exception.ErrorResponse;
import com.example.auth.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Dedicated REST Controller for the Admin Panel.
 * All endpoints strictly require the caller to possess ROLE_ADMIN authority.
 */
@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin", description = "Endpoints for Admin Panel operations, dashboard metrics, and user management")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * Retrieves high-level analytics and user statistics for the Admin Dashboard.
     */
    @GetMapping("/dashboard")
    @Operation(
            summary = "Get Admin Dashboard Metrics",
            description = "Returns user breakdown statistics (total, admins, users) and the 5 most recent signups. Requires ROLE_ADMIN."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Dashboard metrics retrieved successfully",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthenticated - Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - Caller lacks ROLE_ADMIN authority",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<SuccessResponse<AdminDashboardStats>> getDashboardStats() {
        AdminDashboardStats stats = adminService.getDashboardStats();
        return ResponseEntity.ok(SuccessResponse.ok("Admin dashboard metrics retrieved successfully", stats));
    }

    /**
     * Retrieves all registered users in the system.
     */
    @GetMapping("/users")
    @Operation(
            summary = "Get All Users for Management",
            description = "Returns complete user list for the admin user table. Requires ROLE_ADMIN."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "User list retrieved successfully",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthenticated",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<SuccessResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = adminService.getAllUsers();
        return ResponseEntity.ok(SuccessResponse.ok("Users retrieved successfully", users));
    }

    /**
     * Changes the role of a user (Promote to Admin / Demote to User).
     */
    @PatchMapping("/users/{id}/role")
    @Operation(
            summary = "Change User Role",
            description = "Updates a user's role to USER or ADMIN. Requires ROLE_ADMIN."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "User role updated successfully",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation failed on role payload",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthenticated",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found with specified UUID",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<SuccessResponse<UserResponse>> updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        UserResponse response = adminService.updateUserRole(id, request.role());
        return ResponseEntity.ok(SuccessResponse.ok("User role updated successfully", response));
    }

    /**
     * Deletes a user by UUID.
     */
    @DeleteMapping("/users/{id}")
    @Operation(
            summary = "Delete User Account",
            description = "Permanently deletes a user from the system. Requires ROLE_ADMIN."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "User deleted successfully",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthenticated",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found with specified UUID",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<SuccessResponse<Void>> deleteUser(@PathVariable UUID id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(SuccessResponse.ok("User permanently deleted successfully"));
    }
}
