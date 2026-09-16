package com.superapp.transaction.reward.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.common.response.PaginationMeta;
import com.superapp.transaction.reward.dto.AdminRewardAdjustmentRequest;
import com.superapp.transaction.reward.dto.AdminRewardAdjustmentResponse;
import com.superapp.transaction.reward.dto.RewardLedgerItemResponse;
import com.superapp.transaction.reward.dto.RewardReversalRequest;
import com.superapp.transaction.reward.service.RewardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/rewards")
@Tag(name = "Admin Rewards", description = "Administrative adjustments, reversals, and ledger oversight")
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
public class AdminRewardController {

    private final RewardService rewardService;

    public AdminRewardController(RewardService rewardService) {
        this.rewardService = rewardService;
    }

    @PostMapping("/adjustments")
    @Operation(summary = "Create an administrative reward adjustment", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<AdminRewardAdjustmentResponse>> adjustReward(
            @Valid @RequestBody AdminRewardAdjustmentRequest request,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID adminUserId = UUID.fromString(userDetails.getUsername());
        String effectiveRequestId = (requestId != null && !requestId.isBlank()) ? requestId : UUID.randomUUID().toString();

        AdminRewardAdjustmentResponse response = rewardService.adjustReward(
                request, idempotencyKey, effectiveRequestId, adminUserId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reward adjustment created successfully", response));
    }

    @PostMapping("/reversals")
    @Operation(summary = "Process a compensating reward reversal", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<RewardLedgerItemResponse>> reverseReward(
            @Valid @RequestBody RewardReversalRequest request,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID adminUserId = UUID.fromString(userDetails.getUsername());
        String effectiveRequestId = (requestId != null && !requestId.isBlank()) ? requestId : UUID.randomUUID().toString();

        RewardLedgerItemResponse response = rewardService.reverseReward(
                request.ledgerEntryId(), request.reason(), effectiveRequestId, adminUserId);

        return ResponseEntity.ok(ApiResponse.success("Reward reversal processed successfully", response));
    }

    @GetMapping("/ledger")
    @Operation(summary = "Get reward ledger with administrative filters", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<?>> getAdminLedger(
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<RewardLedgerItemResponse> page = rewardService.getAdminLedger(
                customerId, type, status, fromDate, toDate, pageable);

        return ResponseEntity.ok(ApiResponse.success(
                "Admin reward ledger fetched successfully",
                page.getContent(),
                PaginationMeta.of(page)));
    }
}
