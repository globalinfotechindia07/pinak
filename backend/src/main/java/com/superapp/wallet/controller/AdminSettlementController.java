package com.superapp.wallet.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.wallet.dto.PayoutRequestResponse;
import com.superapp.wallet.dto.PlatformSettlementOverviewResponse;
import com.superapp.wallet.enums.PayoutStatus;
import com.superapp.wallet.service.MerchantPayoutService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/settlements")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettlementController {

    private final MerchantPayoutService payoutService;

    public AdminSettlementController(MerchantPayoutService payoutService) {
        this.payoutService = payoutService;
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<PlatformSettlementOverviewResponse>> getOverview() {
        PlatformSettlementOverviewResponse overview = payoutService.getPlatformSettlementOverview();
        return ResponseEntity.ok(ApiResponse.success(overview, "Platform settlement overview retrieved successfully"));
    }

    @GetMapping("/payouts")
    public ResponseEntity<ApiResponse<Page<PayoutRequestResponse>>> getAllPayouts(
            @RequestParam(name = "status", required = false) PayoutStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PayoutRequestResponse> page = payoutService.getAllPayoutsForAdmin(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Global payout queue retrieved successfully"));
    }

    @PostMapping("/payouts/{id}/hold")
    public ResponseEntity<ApiResponse<PayoutRequestResponse>> holdPayout(
            @PathVariable("id") UUID payoutId,
            @RequestBody(required = false) Map<String, String> body,
            Principal principal) {
        String reason = body != null ? body.get("reason") : "Fraud audit hold by Super Admin";
        UUID adminId = extractAdminId(principal);
        PayoutRequestResponse response = payoutService.adminHoldPayout(payoutId, reason, adminId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payout hold placed successfully"));
    }

    @PostMapping("/payouts/{id}/release")
    public ResponseEntity<ApiResponse<PayoutRequestResponse>> releasePayout(
            @PathVariable("id") UUID payoutId,
            Principal principal) {
        UUID adminId = extractAdminId(principal);
        PayoutRequestResponse response = payoutService.adminReleasePayout(payoutId, adminId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payout hold released successfully"));
    }

    @PostMapping("/payouts/{id}/retry")
    public ResponseEntity<ApiResponse<PayoutRequestResponse>> retryPayout(
            @PathVariable("id") UUID payoutId,
            Principal principal) {
        UUID adminId = extractAdminId(principal);
        PayoutRequestResponse response = payoutService.adminRetryPayout(payoutId, adminId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payout retry dispatched successfully"));
    }

    private UUID extractAdminId(Principal principal) {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }
}
