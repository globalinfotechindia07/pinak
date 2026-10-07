package com.superapp.merchant.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.merchant.dto.CreateMerchantRequest;
import com.superapp.merchant.dto.MerchantResponse;
import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.merchant.dto.UpdateMerchantRequest;
import com.superapp.merchant.service.MerchantService;
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
@RequestMapping("/api/v1/merchants")
@Tag(name = "Merchants", description = "Merchant business profile management and admin approval")
public class MerchantController {

    private final MerchantService merchantService;

    public MerchantController(MerchantService merchantService) {
        this.merchantService = merchantService;
    }

    @PostMapping
    @Operation(summary = "Register/Create a new merchant business", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<MerchantResponse>> createMerchant(
            @Valid @RequestBody CreateMerchantRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        MerchantResponse response = merchantService.createMerchant(request, currentUserId, isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Merchant created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all merchants (paginated)", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'MERCHANT')")
    public ResponseEntity<ApiResponse<Page<MerchantResponse>>> getAllMerchants(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success("Merchants retrieved", merchantService.getAllMerchants(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get merchant by ID", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MerchantResponse>> getMerchantById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Merchant retrieved", merchantService.getMerchantById(id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update merchant business profile", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<MerchantResponse>> updateMerchant(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMerchantRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        MerchantResponse response = merchantService.updateMerchant(id, request, currentUserId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Merchant updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete merchant business profile", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMerchant(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        merchantService.deleteMerchant(id, currentUserId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Merchant deleted successfully", null));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Admin update merchant approval status (APPROVED / REJECTED / SUSPENDED)", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<MerchantResponse>> updateApprovalStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateApprovalStatusRequest request) {

        MerchantResponse response = merchantService.updateApprovalStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Merchant approval status updated", response));
    }
}
