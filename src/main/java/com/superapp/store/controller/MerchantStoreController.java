package com.superapp.store.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.store.dto.*;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.service.StoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/merchant/stores")
@Tag(name = "Merchant Stores", description = "Current authenticated merchant store branch management and submission")
@PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR')")
public class MerchantStoreController {

    private final StoreService storeService;

    public MerchantStoreController(StoreService storeService) {
        this.storeService = storeService;
    }

    @PostMapping
    @Operation(summary = "Create a new store branch for the authenticated merchant", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StoreResponse>> createStore(
            @Valid @RequestBody MerchantCreateStoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        StoreResponse response = storeService.createMerchantStore(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Store created successfully", response));
    }

    @GetMapping
    @Operation(summary = "List all store branches belonging to the authenticated merchant", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<StoreResponse>>> getMyStores(
            @RequestParam(required = false) StoreStatus status,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        Page<StoreResponse> stores = storeService.getMerchantStores(currentUserId, pageable, status, approvalStatus);
        return ResponseEntity.ok(ApiResponse.success("Stores fetched successfully", stores));
    }

    @GetMapping("/{storeId}")
    @Operation(summary = "Get a store branch by ID belonging to the authenticated merchant", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StoreResponse>> getStoreById(
            @PathVariable UUID storeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        StoreResponse response = storeService.getMerchantStoreById(storeId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Store retrieved", response));
    }

    @PutMapping("/{storeId}")
    @Operation(summary = "Update a store branch belonging to the authenticated merchant", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StoreResponse>> updateStore(
            @PathVariable UUID storeId,
            @Valid @RequestBody MerchantUpdateStoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        StoreResponse response = storeService.updateMerchantStore(storeId, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Store updated successfully", response));
    }

    @DeleteMapping("/{storeId}")
    @Operation(summary = "Delete a store branch belonging to the authenticated merchant", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> deleteStore(
            @PathVariable UUID storeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        storeService.deleteMerchantStore(storeId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Store outlet deactivated and deleted successfully", null));
    }

    @PostMapping("/{storeId}/resend-invite")
    @Operation(summary = "Resend activation / welcome invite link to store branch manager", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> resendInvite(
            @PathVariable UUID storeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        storeService.resendStoreManagerInvite(storeId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Manager activation link resent successfully", null));
    }

    @PostMapping("/{storeId}/submit")
    @Operation(summary = "Submit a store branch for admin verification and approval", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StoreApprovalActionResponse>> submitForApproval(
            @PathVariable UUID storeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        StoreApprovalActionResponse response = storeService.submitStoreForApproval(storeId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Store submitted for approval", response));
    }
}
