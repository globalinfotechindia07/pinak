package com.superapp.user.controller;

import com.superapp.common.audit.AuditLog;
import com.superapp.common.audit.AuditLogRepository;
import com.superapp.common.audit.AuditLogResponse;
import com.superapp.common.response.ApiResponse;
import com.superapp.user.dto.RoleDTO;
import com.superapp.user.dto.StaffDTO;
import com.superapp.user.dto.UserDTO;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
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
    public ResponseEntity<ApiResponse<UserDTO.Response>> createUser(
            @Valid @RequestBody UserDTO.CreateRequest request) {

        UserDTO.Response created = userService.createUser(request);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", created));
    }

    @GetMapping("/users")
    @Operation(summary = "List all users (paginated and filtered)")
    public ResponseEntity<ApiResponse<Page<UserDTO.Response>>> getAllUsers(
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<UserDTO.Response> users = userService.getAdminUsers(status, role, search, fromDate, toDate, pageable);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Get user details by ID")
    public ResponseEntity<ApiResponse<UserDTO.Response>> getUserById(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success("User retrieved", userService.getUserById(userId)));
    }

    @PatchMapping("/users/{userId}/status")
    @Operation(summary = "Block, unblock, activate, or suspend a user account")
    public ResponseEntity<ApiResponse<UserDTO.Response>> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UserDTO.UpdateStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {

        UUID adminUserId = userDetails != null ? UUID.fromString(userDetails.getUsername()) : null;
        String requestId = httpRequest.getHeader("X-Request-Id");
        UserDTO.Response updated = userService.changeUserStatus(userId, request.status(), request.reason(), adminUserId, requestId);
        return ResponseEntity.ok(ApiResponse.success("User status updated to " + request.status(), updated));
    }

    @PatchMapping("/users/{userId}/role")
    @Operation(summary = "Change user role")
    public ResponseEntity<ApiResponse<UserDTO.Response>> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UserDTO.UpdateRoleRequest request) {

        UserDTO.Response updated = userService.changeUserRole(userId, request.role());
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
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getAuditLogs(
            @PageableDefault(size = 50) Pageable pageable) {

        Page<AuditLogResponse> logs = auditLogRepository.findAll(pageable).map(AuditLogResponse::from);
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved", logs));
    }

    @GetMapping("/audit-logs/{auditLogId}")
    @Operation(summary = "Get audit log details by ID")
    public ResponseEntity<ApiResponse<AuditLogResponse>> getAuditLogById(@PathVariable UUID auditLogId) {
        AuditLog log = auditLogRepository.findById(auditLogId)
                .orElseThrow(() -> new com.superapp.common.exception.AppException("Audit log not found", com.superapp.common.response.ApiError.RESOURCE_NOT_FOUND, 404));
        return ResponseEntity.ok(ApiResponse.success("Audit log retrieved", AuditLogResponse.from(log)));
    }

    // ---- Platform Roles & RBAC ----

    @GetMapping("/roles")
    @Operation(summary = "Get all platform system and custom roles")
    public ResponseEntity<ApiResponse<List<RoleDTO.Response>>> getPlatformRoles() {
        List<RoleDTO.Response> roles = userService.getRoles("PLATFORM", null);
        return ResponseEntity.ok(ApiResponse.success("Platform roles retrieved", roles));
    }

    @PostMapping("/roles")
    @Operation(summary = "Create custom platform role")
    public ResponseEntity<ApiResponse<RoleDTO.Response>> createPlatformRole(
            @Valid @RequestBody RoleDTO.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID adminUserId = userDetails != null ? UUID.fromString(userDetails.getUsername()) : null;
        RoleDTO.Response created = userService.createRole(request, adminUserId);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Role created successfully", created));
    }

    @PutMapping("/roles/{roleId}")
    @Operation(summary = "Update platform role permissions and details")
    public ResponseEntity<ApiResponse<RoleDTO.Response>> updatePlatformRole(
            @PathVariable String roleId,
            @Valid @RequestBody RoleDTO.UpdateRequest request) {
        RoleDTO.Response updated = userService.updateRole(roleId, request);
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", updated));
    }

    @DeleteMapping("/roles/{roleId}")
    @Operation(summary = "Delete custom platform role")
    public ResponseEntity<ApiResponse<Void>> deletePlatformRole(@PathVariable String roleId) {
        userService.deleteRole(roleId);
        return ResponseEntity.ok(ApiResponse.success("Role deleted successfully"));
    }

    // ---- Platform Staff Team Management ----

    @GetMapping("/staff")
    @Operation(summary = "Get all platform staff members")
    public ResponseEntity<ApiResponse<List<StaffDTO.Response>>> getPlatformStaff() {
        List<StaffDTO.Response> staff = userService.getStaffMembers("PLATFORM", null);
        return ResponseEntity.ok(ApiResponse.success("Platform staff retrieved", staff));
    }

    @PostMapping("/staff")
    @Operation(summary = "Invite or assign staff member to platform")
    public ResponseEntity<ApiResponse<StaffDTO.Response>> invitePlatformStaff(
            @Valid @RequestBody StaffDTO.InviteRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID adminUserId = userDetails != null ? UUID.fromString(userDetails.getUsername()) : null;
        StaffDTO.Response assigned = userService.assignOrInviteStaff(request, adminUserId);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Staff member assigned successfully", assigned));
    }

    @PatchMapping("/staff/{staffId}/status")
    @Operation(summary = "Update staff member status (ACTIVE, SUSPENDED)")
    public ResponseEntity<ApiResponse<StaffDTO.Response>> updateStaffStatus(
            @PathVariable UUID staffId,
            @Valid @RequestBody StaffDTO.UpdateStatusRequest request) {
        StaffDTO.Response updated = userService.updateStaffStatus(staffId, request.status());
        return ResponseEntity.ok(ApiResponse.success("Staff status updated", updated));
    }

    @PatchMapping("/staff/{staffId}/role")
    @Operation(summary = "Update staff member role and custom permissions")
    public ResponseEntity<ApiResponse<StaffDTO.Response>> updateStaffRole(
            @PathVariable UUID staffId,
            @Valid @RequestBody StaffDTO.UpdateRoleRequest request) {
        StaffDTO.Response updated = userService.updateStaffRole(staffId, request.roleId(), request.customPermissions());
        return ResponseEntity.ok(ApiResponse.success("Staff role and permissions updated", updated));
    }

    @DeleteMapping("/staff/{staffId}")
    @Operation(summary = "Remove staff member assignment")
    public ResponseEntity<ApiResponse<Void>> removeStaffMember(@PathVariable UUID staffId) {
        userService.removeStaffMember(staffId);
        return ResponseEntity.ok(ApiResponse.success("Staff member assignment removed"));
    }
}
