package com.superapp.reward.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.reward.dto.EarnRewardRequest;
import com.superapp.reward.dto.RedeemRewardRequest;
import com.superapp.reward.dto.RewardAccountResponse;
import com.superapp.reward.dto.RewardTransactionResponse;
import com.superapp.reward.service.RewardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rewards")
@Tag(name = "Rewards", description = "Rewards points, cashback balance, and redemption")
@SecurityRequirement(name = "bearerAuth")
public class RewardController {

    private final RewardService rewardService;

    public RewardController(RewardService rewardService) {
        this.rewardService = rewardService;
    }

    @GetMapping("/account/{customerId}")
    @Operation(summary = "Get reward points balance for customer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RewardAccountResponse>> getAccount(@PathVariable UUID customerId) {
        return ResponseEntity.ok(ApiResponse.success("Reward account retrieved", rewardService.getAccountResponse(customerId)));
    }

    @GetMapping("/transactions/{customerId}")
    @Operation(summary = "Get customer reward transactions history (paginated)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<RewardTransactionResponse>>> getTransactions(
            @PathVariable UUID customerId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success("Reward transactions retrieved",
                rewardService.getHistory(customerId, pageable)));
    }

    @PostMapping("/earn")
    @Operation(summary = "Credit reward points to customer")
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<RewardTransactionResponse>> earnPoints(
            @Valid @RequestBody EarnRewardRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Points credited successfully", rewardService.earnPoints(request)));
    }

    @PostMapping("/redeem")
    @Operation(summary = "Redeem customer reward points")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RewardTransactionResponse>> redeemPoints(
            @Valid @RequestBody RedeemRewardRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Points redeemed successfully", rewardService.redeemPoints(request)));
    }
}
