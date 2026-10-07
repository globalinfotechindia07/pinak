package com.superapp.transaction.redemption.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.common.response.PaginationMeta;
import com.superapp.transaction.redemption.dto.RedemptionHistoryResponse;
import com.superapp.transaction.redemption.dto.RedemptionResponse;
import com.superapp.transaction.redemption.service.RedemptionService;
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
@RequestMapping("/api/v1/admin/redemptions")
@Tag(name = "Admin Redemptions", description = "Administrative oversight and reporting of offer redemptions")
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
public class AdminRedemptionController {

    private final RedemptionService redemptionService;

    public AdminRedemptionController(RedemptionService redemptionService) {
        this.redemptionService = redemptionService;
    }

    @GetMapping
    @Operation(summary = "Get all redemptions with administrative filters", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<?>> getAdminRedemptions(
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID merchantId,
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) UUID offerId,
            @RequestParam(required = false) UUID transactionId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId) {

        String effectiveRequestId = (requestId != null && !requestId.isBlank()) ? requestId : UUID.randomUUID().toString();

        Page<RedemptionHistoryResponse> page = redemptionService.getAdminRedemptions(
                customerId, merchantId, storeId, offerId, transactionId, status, fromDate, toDate, pageable);

        return ResponseEntity.ok(ApiResponse.success(
                "Admin redemptions fetched successfully",
                page.getContent(),
                PaginationMeta.of(page)));
    }

    @GetMapping("/{redemptionId}")
    @Operation(summary = "Get redemption details by ID (Admin)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<RedemptionResponse>> getAdminRedemptionById(
            @PathVariable UUID redemptionId,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID currentUserId = UUID.fromString(userDetails.getUsername());

        RedemptionResponse response = redemptionService.getRedemptionById(redemptionId, currentUserId, true);

        return ResponseEntity.ok(ApiResponse.success("Redemption fetched successfully", response));
    }
}
