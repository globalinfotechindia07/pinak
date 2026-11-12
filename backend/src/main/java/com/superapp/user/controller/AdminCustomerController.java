package com.superapp.user.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.user.dto.CustomerDtos.*;
import com.superapp.user.service.AdminCustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping("/api/v1/admin/customers")
@Tag(name = "Admin Customer Directory", description = "Institutional-grade platform customer directory, wallet oversight & account moderation")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminCustomerController {

    private static final UUID DEFAULT_SUPER_ADMIN_ID = UUID.fromString("d0000000-0000-0000-0000-000000000001");

    private final AdminCustomerService customerService;

    public AdminCustomerController(AdminCustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    @Operation(summary = "Get verified customer directory with real metrics & filters")
    public ResponseEntity<ApiResponse<Page<CustomerDirectoryResponse>>> getCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String segment,
            @RequestParam(required = false) String city,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<CustomerDirectoryResponse> customers = customerService.getCustomers(
                search, status, segment, city, pageable);
        return ResponseEntity.ok(ApiResponse.success("Customer directory fetched successfully", customers));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get aggregate platform customer statistics")
    public ResponseEntity<ApiResponse<CustomerStatsResponse>> getCustomerStats() {
        CustomerStatsResponse stats = customerService.getCustomerStats();
        return ResponseEntity.ok(ApiResponse.success("Customer stats fetched successfully", stats));
    }

    @GetMapping("/{customerId}/details")
    @Operation(summary = "Get full customer profile, reward ledger, transactions, and bookings")
    public ResponseEntity<ApiResponse<CustomerDetailResponse>> getCustomerDetails(
            @PathVariable UUID customerId) {
        CustomerDetailResponse details = customerService.getCustomerDetails(customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer details fetched successfully", details));
    }

    @PatchMapping("/{customerId}/status")
    @Operation(summary = "Moderate customer account access (ACTIVE or SUSPENDED)")
    public ResponseEntity<ApiResponse<CustomerDirectoryResponse>> updateCustomerStatus(
            @PathVariable UUID customerId,
            @Valid @RequestBody UpdateCustomerStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {

        UUID adminUserId = resolveAdminUserId(userDetails);
        String requestId = httpRequest.getHeader("X-Request-Id");

        CustomerDirectoryResponse updated = customerService.updateCustomerStatus(
                customerId, request.status(), request.reason(), adminUserId, requestId);
        return ResponseEntity.ok(ApiResponse.success("Customer status updated to " + request.status(), updated));
    }

    @PostMapping("/{customerId}/rewards/adjust")
    @Operation(summary = "Perform manual loyalty reward points adjustment (+ credit, - debit)")
    public ResponseEntity<ApiResponse<CustomerRewardSummary>> adjustRewardPoints(
            @PathVariable UUID customerId,
            @Valid @RequestBody AdjustCustomerPointsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID adminUserId = resolveAdminUserId(userDetails);
        CustomerRewardSummary updatedWallet = customerService.adjustCustomerRewardPoints(
                customerId, request.pointsDelta(), request.reason(), adminUserId);
        return ResponseEntity.ok(ApiResponse.success("Reward points adjusted successfully", updatedWallet));
    }

    @PostMapping
    @Operation(summary = "Register new customer from admin portal")
    public ResponseEntity<ApiResponse<CustomerDirectoryResponse>> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID adminUserId = resolveAdminUserId(userDetails);
        CustomerDirectoryResponse created = customerService.createCustomer(request, adminUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Customer registered successfully", created));
    }

    private UUID resolveAdminUserId(UserDetails userDetails) {
        if (userDetails != null && userDetails.getUsername() != null && userDetails.getUsername().length() == 36) {
            try {
                return UUID.fromString(userDetails.getUsername());
            } catch (IllegalArgumentException ignored) {}
        }
        return DEFAULT_SUPER_ADMIN_ID;
    }
}
