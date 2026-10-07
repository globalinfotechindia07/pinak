package com.superapp.merchant.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.merchant.dto.MerchantResponse;
import com.superapp.merchant.service.MerchantService;
import com.superapp.user.dto.RoleDTO;
import com.superapp.user.dto.StaffDTO;
import com.superapp.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/merchant")
@Tag(name = "Merchant & Store Staff Management", description = "Merchant and branch store staff team, RBAC roles, and invitation management")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
public class MerchantStaffController {

    private final UserService userService;
    private final MerchantService merchantService;

    public MerchantStaffController(UserService userService, MerchantService merchantService) {
        this.userService = userService;
        this.merchantService = merchantService;
    }

    private UUID getMerchantId(UserDetails userDetails) {
        if (userDetails == null) return null;
        try {
            UUID userId = UUID.fromString(userDetails.getUsername());
            MerchantResponse profile = merchantService.getMerchantProfile(userId);
            return (profile != null && profile.id() != null) ? UUID.fromString(profile.id()) : null;
        } catch (Exception e) {
            return null;
        }
    }

    // ---- Roles ----

    @GetMapping("/roles")
    @Operation(summary = "Get roles for merchant and store scopes")
    public ResponseEntity<ApiResponse<List<RoleDTO.Response>>> getRoles(
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) UUID scopeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        List<RoleDTO.Response> roles = new ArrayList<>();
        if (scope != null && !scope.isBlank()) {
            roles.addAll(userService.getRoles(scope, scopeId));
        } else {
            // Return both STORE and MERCHANT roles so frontend can display available roles
            roles.addAll(userService.getRoles("STORE", scopeId));
            roles.addAll(userService.getRoles("MERCHANT", scopeId));
        }
        return ResponseEntity.ok(ApiResponse.success("Roles retrieved successfully", roles));
    }

    @PostMapping("/roles")
    @Operation(summary = "Create custom role for merchant or store")
    public ResponseEntity<ApiResponse<RoleDTO.Response>> createRole(
            @Valid @RequestBody RoleDTO.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = userDetails != null ? UUID.fromString(userDetails.getUsername()) : null;
        RoleDTO.Response created = userService.createRole(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Role created successfully", created));
    }

    @PutMapping("/roles/{roleId}")
    @Operation(summary = "Update custom role permissions and metadata")
    public ResponseEntity<ApiResponse<RoleDTO.Response>> updateRole(
            @PathVariable String roleId,
            @Valid @RequestBody RoleDTO.UpdateRequest request) {
        RoleDTO.Response updated = userService.updateRole(roleId, request);
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", updated));
    }

    @DeleteMapping("/roles/{roleId}")
    @Operation(summary = "Delete custom role")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable String roleId) {
        userService.deleteRole(roleId);
        return ResponseEntity.ok(ApiResponse.success("Role deleted successfully"));
    }

    // ---- Staff Members ----

    @GetMapping("/staff")
    @Operation(summary = "Get staff members for merchant or store")
    public ResponseEntity<ApiResponse<List<StaffDTO.Response>>> getStaff(
            @RequestParam(required = false, defaultValue = "STORE") String scope,
            @RequestParam(required = false) UUID scopeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        UUID merchantId = getMerchantId(userDetails);
        UUID effectiveScopeId = scopeId != null ? scopeId : ("MERCHANT".equalsIgnoreCase(scope) ? merchantId : null);
        
        List<StaffDTO.Response> staff = userService.getStaffMembers(scope, effectiveScopeId);
        return ResponseEntity.ok(ApiResponse.success("Staff members retrieved successfully", staff));
    }

    @PostMapping("/staff")
    @Operation(summary = "Invite or assign staff member to merchant or store")
    public ResponseEntity<ApiResponse<StaffDTO.Response>> inviteStaff(
            @Valid @RequestBody StaffDTO.InviteRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = userDetails != null ? UUID.fromString(userDetails.getUsername()) : null;
        StaffDTO.Response assigned = userService.assignOrInviteStaff(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Staff invitation dispatched successfully", assigned));
    }

    @PatchMapping("/staff/{staffId}/status")
    @Operation(summary = "Update staff status (ACTIVE, SUSPENDED)")
    public ResponseEntity<ApiResponse<StaffDTO.Response>> updateStaffStatus(
            @PathVariable UUID staffId,
            @Valid @RequestBody StaffDTO.UpdateStatusRequest request) {
        StaffDTO.Response updated = userService.updateStaffStatus(staffId, request.status());
        return ResponseEntity.ok(ApiResponse.success("Staff status updated successfully", updated));
    }

    @PatchMapping("/staff/{staffId}/role")
    @Operation(summary = "Update staff role and permissions")
    public ResponseEntity<ApiResponse<StaffDTO.Response>> updateStaffRole(
            @PathVariable UUID staffId,
            @Valid @RequestBody StaffDTO.UpdateRoleRequest request) {
        StaffDTO.Response updated = userService.updateStaffRole(staffId, request.roleId(), request.customPermissions());
        return ResponseEntity.ok(ApiResponse.success("Staff role and permissions updated successfully", updated));
    }

    @DeleteMapping("/staff/{staffId}")
    @Operation(summary = "Remove staff member assignment")
    public ResponseEntity<ApiResponse<Void>> removeStaffMember(@PathVariable UUID staffId) {
        userService.removeStaffMember(staffId);
        return ResponseEntity.ok(ApiResponse.success("Staff member assignment removed"));
    }
}
