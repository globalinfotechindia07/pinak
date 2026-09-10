package com.superapp.merchant.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.merchant.dto.AdminRejectMerchantRequest;
import com.superapp.merchant.dto.AdminSuspendMerchantRequest;
import com.superapp.merchant.dto.MerchantApprovalActionResponse;
import com.superapp.merchant.dto.MerchantResponse;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.service.MerchantService;
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
@RequestMapping("/api/v1/admin/merchants")
@Tag(name = "Admin Merchants", description = "Admin operations for merchant verification, approval, rejection, and suspension")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminMerchantController {

    private final MerchantService merchantService;

    public AdminMerchantController(MerchantService merchantService) {
        this.merchantService = merchantService;
    }

    @GetMapping
    @Operation(summary = "Get all merchants with optional status and approvalStatus filters", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<MerchantResponse>>> getAllMerchants(
            @RequestParam(required = false) MerchantStatus status,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<MerchantResponse> merchants = merchantService.getAllMerchants(pageable, status, approvalStatus);
        return ResponseEntity.ok(ApiResponse.success("Merchants retrieved", merchants));
    }

    @GetMapping("/{merchantId}")
    @Operation(summary = "Get merchant by ID", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<MerchantResponse>> getMerchantById(@PathVariable UUID merchantId) {
        MerchantResponse response = merchantService.getMerchantById(merchantId);
        return ResponseEntity.ok(ApiResponse.success("Merchant retrieved", response));
    }

    @PostMapping("/{merchantId}/approve")
    @Operation(summary = "Approve merchant application", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<MerchantApprovalActionResponse>> approveMerchant(
            @PathVariable UUID merchantId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID adminUserId = UUID.fromString(userDetails.getUsername());
        MerchantApprovalActionResponse response = merchantService.approveMerchant(merchantId, adminUserId);
        return ResponseEntity.ok(ApiResponse.success("Merchant approved successfully", response));
    }

    @PostMapping("/{merchantId}/reject")
    @Operation(summary = "Reject merchant application with reason", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<MerchantApprovalActionResponse>> rejectMerchant(
            @PathVariable UUID merchantId,
            @Valid @RequestBody AdminRejectMerchantRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID adminUserId = UUID.fromString(userDetails.getUsername());
        MerchantApprovalActionResponse response = merchantService.rejectMerchant(merchantId, request.getReason(), adminUserId);
        return ResponseEntity.ok(ApiResponse.success("Merchant rejected successfully", response));
    }

    @PostMapping("/{merchantId}/suspend")
    @Operation(summary = "Suspend merchant account with reason", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<MerchantApprovalActionResponse>> suspendMerchant(
            @PathVariable UUID merchantId,
            @Valid @RequestBody AdminSuspendMerchantRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID adminUserId = UUID.fromString(userDetails.getUsername());
        MerchantApprovalActionResponse response = merchantService.suspendMerchant(merchantId, request.getReason(), adminUserId);
        return ResponseEntity.ok(ApiResponse.success("Merchant suspended successfully", response));
    }
}
