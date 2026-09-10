package com.superapp.merchant.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.merchant.dto.MerchantKycRequest;
import com.superapp.merchant.dto.MerchantKycResponse;
import com.superapp.merchant.dto.MerchantResponse;
import com.superapp.merchant.dto.UpdateMerchantProfileRequest;
import com.superapp.merchant.service.MerchantService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/merchant")
@Tag(name = "Merchant Profile", description = "Current authenticated merchant profile and KYC operations")
public class MerchantProfileController {

    private final MerchantService merchantService;

    public MerchantProfileController(MerchantService merchantService) {
        this.merchantService = merchantService;
    }

    @GetMapping("/profile")
    @Operation(summary = "Get current authenticated merchant profile", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR')")
    public ResponseEntity<ApiResponse<MerchantResponse>> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        MerchantResponse response = merchantService.getMerchantProfile(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Merchant profile retrieved", response));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update current authenticated merchant profile", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR')")
    public ResponseEntity<ApiResponse<MerchantResponse>> updateProfile(
            @Valid @RequestBody UpdateMerchantProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        MerchantResponse response = merchantService.updateMerchantProfile(request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Merchant profile updated successfully", response));
    }

    @PostMapping("/kyc")
    @Operation(summary = "Submit KYC verification documents", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR')")
    public ResponseEntity<ApiResponse<MerchantKycResponse>> submitKyc(
            @Valid @RequestBody MerchantKycRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        MerchantKycResponse response = merchantService.submitKyc(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("KYC details submitted successfully", response));
    }
}
