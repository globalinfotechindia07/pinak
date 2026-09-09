package com.superapp.store.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.store.dto.CreateStoreRequest;
import com.superapp.store.dto.StoreResponse;
import com.superapp.store.dto.UpdateStoreRequest;
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
@RequestMapping("/api/v1")
@Tag(name = "Stores", description = "Physical Store (Branch) management, GPS location, and geospatial discovery")
public class StoreController {

    private final StoreService storeService;

    public StoreController(StoreService storeService) {
        this.storeService = storeService;
    }

    @PostMapping("/stores")
    @Operation(summary = "Create a physical branch/store for a merchant", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<StoreResponse>> createStore(
            @Valid @RequestBody CreateStoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        StoreResponse response = storeService.createStore(request, currentUserId, isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Store created successfully", response));
    }

    @GetMapping("/stores")
    @Operation(summary = "Get all stores (paginated)", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<StoreResponse>>> getAllStores(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success("Stores retrieved", storeService.getAllStores(pageable)));
    }

    @GetMapping("/stores/{id}")
    @Operation(summary = "Get store by ID", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<StoreResponse>> getStoreById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Store retrieved", storeService.getStoreById(id)));
    }

    @GetMapping("/merchants/{merchantId}/stores")
    @Operation(summary = "Get all branch stores belonging to a merchant", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<StoreResponse>>> getStoresByMerchantId(
            @PathVariable UUID merchantId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success("Merchant stores retrieved",
                storeService.getStoresByMerchantId(merchantId, pageable)));
    }

    @PutMapping("/stores/{id}")
    @Operation(summary = "Update store details and location", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<StoreResponse>> updateStore(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStoreRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        StoreResponse response = storeService.updateStore(id, request, currentUserId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Store updated successfully", response));
    }

    @DeleteMapping("/stores/{id}")
    @Operation(summary = "Delete store branch", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteStore(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        storeService.deleteStore(id, currentUserId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Store deleted successfully", null));
    }

    @PatchMapping("/stores/{id}/status")
    @Operation(summary = "Admin update store approval status (APPROVED / REJECTED / SUSPENDED)", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<StoreResponse>> updateApprovalStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateApprovalStatusRequest request) {

        StoreResponse response = storeService.updateApprovalStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Store approval status updated", response));
    }

    @GetMapping("/stores/nearby")
    @Operation(summary = "Find nearby approved stores within GPS radius (meters)", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<StoreResponse>>> findNearbyStores(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "5000") double radiusMeters,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<StoreResponse> response = storeService.findNearbyStores(latitude, longitude, radiusMeters, pageable);
        return ResponseEntity.ok(ApiResponse.success("Nearby stores found", response));
    }
}
