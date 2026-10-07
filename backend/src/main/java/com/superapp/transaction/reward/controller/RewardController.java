package com.superapp.transaction.reward.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.common.response.PaginationMeta;
import com.superapp.transaction.reward.dto.RewardBalanceResponse;
import com.superapp.transaction.reward.dto.RewardLedgerItemResponse;
import com.superapp.transaction.reward.service.RewardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rewards")
@Tag(name = "Customer Rewards", description = "Reward balance, earnings, and ledger history")
public class RewardController {

    private final RewardService rewardService;

    public RewardController(RewardService rewardService) {
        this.rewardService = rewardService;
    }

    @GetMapping
    @Operation(summary = "Get authenticated customer reward balance", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('USER')")
    public ResponseEntity<ApiResponse<RewardBalanceResponse>> getRewardBalance(
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID customerId = UUID.fromString(userDetails.getUsername());
        RewardBalanceResponse response = rewardService.getRewardBalance(customerId);

        return ResponseEntity.ok(ApiResponse.success("Reward balance fetched successfully", response));
    }

    @GetMapping("/ledger")
    @Operation(summary = "Get customer reward ledger history", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('USER')")
    public ResponseEntity<ApiResponse<?>> getCustomerLedger(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID customerId = UUID.fromString(userDetails.getUsername());
        Page<RewardLedgerItemResponse> page = rewardService.getCustomerLedger(
                customerId, type, status, fromDate, toDate, pageable);

        return ResponseEntity.ok(ApiResponse.success(
                "Reward ledger fetched successfully",
                page.getContent(),
                PaginationMeta.of(page)));
    }

    @GetMapping("/ledger/{entryId}")
    @Operation(summary = "Get individual reward ledger entry by ID", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RewardLedgerItemResponse>> getLedgerEntryById(
            @PathVariable UUID entryId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        RewardLedgerItemResponse response = rewardService.getLedgerEntryById(entryId, currentUserId, isAdmin);

        return ResponseEntity.ok(ApiResponse.success("Reward ledger entry fetched successfully", response));
    }
}
