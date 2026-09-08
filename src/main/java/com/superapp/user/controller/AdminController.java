package com.superapp.user.controller;

import com.superapp.common.audit.AuditLog;
import com.superapp.common.audit.AuditLogRepository;
import com.superapp.common.response.ApiResponse;
import com.superapp.user.dto.UpdateUserRoleRequest;
import com.superapp.user.dto.UpdateUserStatusRequest;
import com.superapp.user.dto.UserResponse;
import com.superapp.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Admin panel — SUPER_ADMIN role required.
 * All endpoints double-enforced: SecurityConfig URL rule + @PreAuthorize method-level.
 */
@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin Panel", description = "Admin user and system management")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminController {

    private final UserService userService;
    private final AuditLogRepository auditLogRepository;

    public AdminController(UserService userService, AuditLogRepository auditLogRepository) {
        this.userService = userService;
        this.auditLogRepository = auditLogRepository;
    }

    @PostMapping("/users")
    @Operation(summary = "Create user account (Admin, Merchant, or Customer) with profile picture")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody com.superapp.user.dto.CreateUserRequest request) {

        UserResponse created = userService.createUser(request);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", created));
    }

    @GetMapping("/users")
    @Operation(summary = "List all users (paginated)")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(
            @PageableDefault(size = 20) Pageable pageable) {

        Page<UserResponse> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Get user details by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success("User retrieved", userService.getUserById(userId)));
    }

    @PatchMapping("/users/{userId}/status")
    @Operation(summary = "Block or unblock a user account")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {

        UserResponse updated = userService.changeUserStatus(userId, request.status());
        return ResponseEntity.ok(ApiResponse.success("User status updated to " + request.status(), updated));
    }

    @PatchMapping("/users/{userId}/role")
    @Operation(summary = "Change user role")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequest request) {

        UserResponse updated = userService.changeUserRole(userId, request.role());
        return ResponseEntity.ok(ApiResponse.success("User role updated to " + request.role(), updated));
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Delete a user account")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "View paginated audit logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @PageableDefault(size = 50) Pageable pageable) {

        Page<AuditLog> logs = auditLogRepository.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved", logs));
    }
}
