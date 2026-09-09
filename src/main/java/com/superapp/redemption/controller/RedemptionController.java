package com.superapp.redemption.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.redemption.dto.CreateRedemptionRequest;
import com.superapp.redemption.dto.RedemptionResponse;
import com.superapp.redemption.service.RedemptionService;
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
@RequestMapping("/api/v1/redemptions")
@Tag(name = "Redemptions", description = "Offer redemption, bill discounting, and payable calculation")
public class RedemptionController {

    private final RedemptionService redemptionService;

    public RedemptionController(RedemptionService redemptionService) {
        this.redemptionService = redemptionService;
    }

    @PostMapping
    @Operation(summary = "Create an offer redemption and calculate payable amount", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RedemptionResponse>> createRedemption(
            @Valid @RequestBody CreateRedemptionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID customerId = UUID.fromString(userDetails.getUsername());
        RedemptionResponse response = redemptionService.createRedemption(request, customerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Redemption created successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get redemption details by ID", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RedemptionResponse>> getRedemptionById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        RedemptionResponse response = redemptionService.getRedemptionById(id, currentUserId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Redemption retrieved", response));
    }

    @GetMapping
    @Operation(summary = "Get all redemptions (Admin / Merchant only)", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'MERCHANT', 'VENDOR')")
    public ResponseEntity<ApiResponse<Page<RedemptionResponse>>> getAllRedemptions(
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(ApiResponse.success("Redemptions retrieved",
                redemptionService.getAllRedemptions(pageable)));
    }

    @GetMapping("/me")
    @Operation(summary = "Get logged in customer's redemption history", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<RedemptionResponse>>> getMyRedemptions(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {

        UUID customerId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("My redemptions retrieved",
                redemptionService.getCustomerRedemptions(customerId, pageable)));
    }
}
