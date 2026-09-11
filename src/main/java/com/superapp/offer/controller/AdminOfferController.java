package com.superapp.offer.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.common.response.PaginationMeta;
import com.superapp.offer.dto.MerchantOfferResponse;
import com.superapp.offer.dto.OfferApprovalResponse;
import com.superapp.offer.dto.RejectOfferRequest;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.enums.OfferType;
import com.superapp.offer.service.OfferService;
import com.superapp.offer.specification.OfferSpecification;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/offers")
@Tag(name = "Admin Offers", description = "Endpoints for platform administrators to review, approve, and reject offers")
@SecurityRequirement(name = "bearerAuth")
public class AdminOfferController {

    private final OfferService offerService;

    public AdminOfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @GetMapping
    @Operation(summary = "List all platform offers with multi-parameter filtering")
    public ResponseEntity<ApiResponse<List<MerchantOfferResponse>>> getAllOffers(
            @RequestParam(required = false) UUID merchantId,
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) OfferStatus status,
            @RequestParam(required = false) OfferApprovalStatus approvalStatus,
            @RequestParam(required = false) OfferType offerType,
            @RequestParam(required = false) Boolean activeOnly,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<MerchantOfferResponse> page = offerService.getAdminOffers(
                OfferSpecification.filter(merchantId, storeId, categoryId, status, approvalStatus, offerType, activeOnly),
                pageable
        );
        PaginationMeta meta = PaginationMeta.of(page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
        return ResponseEntity.ok(ApiResponse.success("Offers fetched successfully", page.getContent(), meta));
    }

    @GetMapping("/{offerId}")
    @Operation(summary = "Get offer details by ID for admin review")
    public ResponseEntity<ApiResponse<MerchantOfferResponse>> getOfferById(
            @PathVariable UUID offerId) {
        MerchantOfferResponse response = offerService.getAdminOfferById(offerId);
        return ResponseEntity.ok(ApiResponse.success("Offer fetched successfully", response));
    }

    @PostMapping("/{offerId}/approve")
    @Operation(summary = "Approve pending offer and activate it for discovery")
    public ResponseEntity<ApiResponse<OfferApprovalResponse>> approveOffer(
            @PathVariable UUID offerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID adminUserId = UUID.fromString(userDetails.getUsername());
        OfferApprovalResponse response = offerService.approveOffer(offerId, adminUserId);
        return ResponseEntity.ok(ApiResponse.success("Offer approved successfully", response));
    }

    @PostMapping("/{offerId}/reject")
    @Operation(summary = "Reject pending offer with mandatory rejection reason")
    public ResponseEntity<ApiResponse<OfferApprovalResponse>> rejectOffer(
            @PathVariable UUID offerId,
            @Valid @RequestBody RejectOfferRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID adminUserId = UUID.fromString(userDetails.getUsername());
        OfferApprovalResponse response = offerService.rejectOffer(offerId, request, adminUserId);
        return ResponseEntity.ok(ApiResponse.success("Offer rejected successfully", response));
    }
}
