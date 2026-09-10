package com.superapp.store.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.store.dto.AdminRejectStoreRequest;
import com.superapp.store.dto.AdminSuspendStoreRequest;
import com.superapp.store.dto.StoreApprovalActionResponse;
import com.superapp.store.dto.StoreResponse;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.service.StoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/stores")
@Tag(name = "Admin Stores", description = "Admin operations for store branch verification, approval, rejection, and suspension")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminStoreController {

    private final StoreService storeService;

    public AdminStoreController(StoreService storeService) {
        this.storeService = storeService;
    }

    @GetMapping
    @Operation(summary = "Get all stores with optional status, approvalStatus, and cityId filters", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<StoreResponse>>> getAllStores(
            @RequestParam(required = false) StoreStatus status,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) String cityId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<StoreResponse> stores = storeService.getAllStoresAdmin(pageable, status, approvalStatus, cityId);
        return ResponseEntity.ok(ApiResponse.success("Stores retrieved", stores));
    }

    @GetMapping("/{storeId}")
    @Operation(summary = "Get store details by ID", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StoreResponse>> getStoreById(@PathVariable UUID storeId) {
        StoreResponse response = storeService.getStoreByIdAdmin(storeId);
        return ResponseEntity.ok(ApiResponse.success("Store retrieved", response));
    }

    @PostMapping("/{storeId}/approve")
    @Operation(summary = "Approve store branch application", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StoreApprovalActionResponse>> approveStore(
            @PathVariable UUID storeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID adminUserId = UUID.fromString(userDetails.getUsername());
        StoreApprovalActionResponse response = storeService.approveStore(storeId, adminUserId);
        return ResponseEntity.ok(ApiResponse.success("Store approved successfully", response));
    }

    @PostMapping("/{storeId}/reject")
    @Operation(summary = "Reject store branch application with reason", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StoreApprovalActionResponse>> rejectStore(
            @PathVariable UUID storeId,
            @Valid @RequestBody AdminRejectStoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID adminUserId = UUID.fromString(userDetails.getUsername());
        StoreApprovalActionResponse response = storeService.rejectStore(storeId, request.getReason(), adminUserId);
        return ResponseEntity.ok(ApiResponse.success("Store rejected successfully", response));
    }

    @PostMapping("/{storeId}/suspend")
    @Operation(summary = "Suspend store branch with reason", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StoreApprovalActionResponse>> suspendStore(
            @PathVariable UUID storeId,
            @Valid @RequestBody AdminSuspendStoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID adminUserId = UUID.fromString(userDetails.getUsername());
        StoreApprovalActionResponse response = storeService.suspendStore(storeId, request.getReason(), adminUserId);
        return ResponseEntity.ok(ApiResponse.success("Store suspended successfully", response));
    }
}
