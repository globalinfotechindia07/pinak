package com.superapp.transaction.redemption.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.common.response.PaginationMeta;
import com.superapp.transaction.redemption.dto.RedemptionHistoryResponse;
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
@RequestMapping("/api/v1/merchant/redemptions")
@Tag(name = "Merchant Redemptions", description = "Store redemption monitoring for merchants")
public class MerchantRedemptionController {

    private final RedemptionService redemptionService;

    public MerchantRedemptionController(RedemptionService redemptionService) {
        this.redemptionService = redemptionService;
    }

    @GetMapping
    @Operation(summary = "Get redemptions for stores owned by authenticated merchant", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasRole('MERCHANT') or hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<?>> getMerchantRedemptions(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) UUID offerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID merchantOwnerUserId = UUID.fromString(userDetails.getUsername());
        String effectiveRequestId = (requestId != null && !requestId.isBlank()) ? requestId : UUID.randomUUID().toString();

        Page<RedemptionHistoryResponse> page = redemptionService.getMerchantRedemptions(
                merchantOwnerUserId, storeId, offerId, status, fromDate, toDate, pageable);

        return ResponseEntity.ok(ApiResponse.success(
                "Merchant redemptions fetched successfully",
                page.getContent(),
                PaginationMeta.of(page)));
    }
}
