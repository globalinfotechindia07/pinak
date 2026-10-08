package com.superapp.offer.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.common.response.PaginationMeta;
import com.superapp.offer.dto.*;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.service.OfferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/merchant/offers")
@Tag(name = "Merchant Offers", description = "Endpoints for merchants to create and manage store offers")
@SecurityRequirement(name = "bearerAuth")
public class MerchantOfferController {

    private final OfferService offerService;

    public MerchantOfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @PostMapping
    @Operation(summary = "Create a new offer for merchant store (Starts in DRAFT/CREATED)")
    public ResponseEntity<ApiResponse<MerchantOfferResponse>> createOffer(
            @Valid @RequestBody CreateOfferRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        MerchantOfferResponse response = offerService.createMerchantOffer(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Offer created successfully", response));
    }

    @GetMapping
    @Operation(summary = "List offers belonging to authenticated merchant")
    public ResponseEntity<ApiResponse<List<MerchantOfferResponse>>> getMyOffers(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) OfferStatus status,
            @RequestParam(required = false) OfferApprovalStatus approvalStatus,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        Page<MerchantOfferResponse> page = offerService.getMerchantOffers(storeId, status, approvalStatus, pageable, currentUserId);
        PaginationMeta meta = PaginationMeta.of(page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
        return ResponseEntity.ok(ApiResponse.success("Offers fetched successfully", page.getContent(), meta));
    }

    @GetMapping("/{offerId}")
    @Operation(summary = "Get single offer by ID belonging to authenticated merchant")
    public ResponseEntity<ApiResponse<MerchantOfferResponse>> getOfferById(
            @PathVariable UUID offerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        MerchantOfferResponse response = offerService.getMerchantOfferById(offerId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Offer fetched successfully", response));
    }

    @PutMapping("/{offerId}")
    @Operation(summary = "Update an existing offer (Material updates to approved offers reset approval to DRAFT)")
    public ResponseEntity<ApiResponse<MerchantOfferResponse>> updateOffer(
            @PathVariable UUID offerId,
            @Valid @RequestBody UpdateOfferRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        MerchantOfferResponse response = offerService.updateMerchantOffer(offerId, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Offer updated successfully", response));
    }

    @PostMapping("/{offerId}/submit")
    @Operation(summary = "Submit offer for admin review and approval")
    public ResponseEntity<ApiResponse<OfferApprovalResponse>> submitOffer(
            @PathVariable UUID offerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        OfferApprovalResponse response = offerService.submitOfferForApproval(offerId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Offer submitted for approval", response));
    }

    @PatchMapping("/{offerId}/status")
    @Operation(summary = "Toggle status of an offer (ACTIVE or PAUSED)")
    public ResponseEntity<ApiResponse<MerchantOfferResponse>> toggleOfferStatus(
            @PathVariable UUID offerId,
            @RequestParam OfferStatus status,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        MerchantOfferResponse response = offerService.toggleMerchantOfferStatus(offerId, status, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Offer status updated successfully", response));
    }

    @DeleteMapping("/{offerId}")
    @Operation(summary = "Delete an existing offer")
    public ResponseEntity<ApiResponse<Void>> deleteOffer(
            @PathVariable UUID offerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID currentUserId = UUID.fromString(userDetails.getUsername());
        offerService.deleteMerchantOffer(offerId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Offer deleted successfully", null));
    }
}
