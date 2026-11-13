package com.superapp.transaction.reward.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.common.response.PaginationMeta;
import com.superapp.platform.dto.WelcomeBonusSettingDto;
import com.superapp.platform.service.WelcomeBonusSettingsService;
import com.superapp.transaction.reward.dto.AdminRewardAdjustmentRequest;
import com.superapp.transaction.reward.dto.AdminRewardAdjustmentResponse;
import com.superapp.transaction.reward.dto.CustomerRewardAccountResponse;
import com.superapp.transaction.reward.dto.RewardBalanceResponse;
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
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/rewards")
@Tag(name = "Admin Rewards", description = "Administrative adjustments, reversals, and ledger oversight")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminRewardController {

    private static final UUID DEFAULT_SUPER_ADMIN_ID = UUID.fromString("d0000000-0000-0000-0000-000000000001");

    private final RewardService rewardService;
    private final WelcomeBonusSettingsService welcomeBonusSettingsService;

    public AdminRewardController(
            RewardService rewardService,
            WelcomeBonusSettingsService welcomeBonusSettingsService) {
        this.rewardService = rewardService;
        this.welcomeBonusSettingsService = welcomeBonusSettingsService;
    }

    @PostMapping("/adjustments")
    @Operation(summary = "Create an administrative reward adjustment", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<AdminRewardAdjustmentResponse>> adjustReward(
            @Valid @RequestBody AdminRewardAdjustmentRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID adminUserId = (userDetails != null && userDetails.getUsername() != null && userDetails.getUsername().length() == 36)
                ? UUID.fromString(userDetails.getUsername())
                : DEFAULT_SUPER_ADMIN_ID;

        String effectiveKey = (idempotencyKey != null && !idempotencyKey.isBlank()) 
                ? idempotencyKey 
                : "adj_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
        String effectiveRequestId = (requestId != null && !requestId.isBlank()) ? requestId : UUID.randomUUID().toString();

        AdminRewardAdjustmentResponse response = rewardService.adjustReward(
                request, effectiveKey, effectiveRequestId, adminUserId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reward adjustment created successfully", response));
    }

    @PostMapping("/reversals")
    @Operation(summary = "Process a compensating reward reversal", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<RewardLedgerItemResponse>> reverseReward(
            @Valid @RequestBody RewardReversalRequest request,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID adminUserId = (userDetails != null && userDetails.getUsername() != null && userDetails.getUsername().length() == 36)
                ? UUID.fromString(userDetails.getUsername())
                : DEFAULT_SUPER_ADMIN_ID;
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
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<RewardLedgerItemResponse> page = rewardService.getAdminLedger(
                customerId, type, status, fromDate, toDate, pageable);

        return ResponseEntity.ok(ApiResponse.success(
                "Admin reward ledger fetched successfully",
                page.getContent(),
                PaginationMeta.of(page)));
    }

    @GetMapping("/accounts")
    @Operation(summary = "Get all customer reward accounts (Admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<CustomerRewardAccountResponse>>> getAllCustomerRewardAccounts() {
        List<CustomerRewardAccountResponse> accounts = rewardService.getAllCustomerRewardAccounts();
        return ResponseEntity.ok(ApiResponse.success("Customer reward accounts fetched successfully", accounts));
    }

    @GetMapping("/{customerId}")
    @Operation(summary = "Get customer reward account details (Admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<RewardBalanceResponse>> getCustomerRewardAccount(
            @PathVariable UUID customerId) {
        RewardBalanceResponse response = rewardService.getRewardBalance(customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer reward account fetched successfully", response));
    }

    @GetMapping("/welcome-bonus-setting")
    @Operation(summary = "Get Super Admin configuration for First-Time User Welcome Coins", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<WelcomeBonusSettingDto>> getWelcomeBonusSetting() {
        WelcomeBonusSettingDto setting = welcomeBonusSettingsService.getWelcomeBonusSetting();
        return ResponseEntity.ok(ApiResponse.success("Welcome bonus setting fetched successfully", setting));
    }

    @PutMapping("/welcome-bonus-setting")
    @Operation(summary = "Update Super Admin configuration for First-Time User Welcome Coins", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<WelcomeBonusSettingDto>> updateWelcomeBonusSetting(
            @Valid @RequestBody WelcomeBonusSettingDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String actor = (userDetails != null && userDetails.getUsername() != null)
                ? userDetails.getUsername()
                : "Super Admin";
        WelcomeBonusSettingDto updated = welcomeBonusSettingsService.updateWelcomeBonusSetting(request, actor);
        return ResponseEntity.ok(ApiResponse.success("Welcome bonus setting updated successfully", updated));
    }
}
