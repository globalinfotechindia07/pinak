package com.superapp.offer.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.offer.dto.CustomerOfferDetailResponse;
import com.superapp.offer.dto.FlashDealsResponse;
import com.superapp.offer.dto.NearbyServiceOffersResponse;
import com.superapp.offer.service.OfferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/offers")
@Tag(name = "Customer Offers", description = "Public customer endpoints for viewing verified active offers and deals")
public class CustomerOfferController {

    private final OfferService offerService;

    public CustomerOfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @GetMapping("/nearby")
    @Operation(summary = "Top Service Offers Near You",
               description = "Returns nearby service deals and promotions with merchant brand and branch geo-distance calculation")
    public ResponseEntity<ApiResponse<NearbyServiceOffersResponse>> getNearbyServiceOffers(
            @Parameter(description = "Offer category type filter", example = "SERVICE")
            @RequestParam(required = false, defaultValue = "SERVICE") String type,

            @Parameter(description = "Customer latitude", example = "12.9716")
            @RequestParam(required = false) Double latitude,

            @Parameter(description = "Customer longitude", example = "77.6412")
            @RequestParam(required = false) Double longitude,

            @Parameter(description = "Search radius in kilometers", example = "5.0")
            @RequestParam(required = false, defaultValue = "5.0") Double radiusKm,

            @Parameter(description = "Category ID filter")
            @RequestParam(required = false) UUID categoryId,

            @Parameter(description = "Maximum results to return", example = "10")
            @RequestParam(required = false, defaultValue = "10") Integer limit,

            @Parameter(description = "Cursor for pagination")
            @RequestParam(required = false) String cursor) {

        NearbyServiceOffersResponse response = offerService.getNearbyServiceOffers(
                type, latitude, longitude, radiusKm, categoryId, limit, cursor);
        return ResponseEntity.ok(ApiResponse.success("Nearby service offers fetched successfully", response));
    }

    @GetMapping("/flash")
    @Operation(summary = "Flash Deals Ending Soon",
               description = "Returns active limited-quantity flash deals ending soon directly from the database")
    public ResponseEntity<ApiResponse<FlashDealsResponse>> getActiveFlashDeals(
            @Parameter(description = "Customer latitude", example = "12.9716")
            @RequestParam(required = false) Double latitude,

            @Parameter(description = "Customer longitude", example = "77.6412")
            @RequestParam(required = false) Double longitude,

            @Parameter(description = "Category ID filter")
            @RequestParam(required = false) UUID categoryId,

            @Parameter(description = "Maximum results to return", example = "10")
            @RequestParam(required = false, defaultValue = "10") Integer limit,

            @Parameter(description = "Cursor for pagination")
            @RequestParam(required = false) String cursor) {

        FlashDealsResponse response = offerService.getActiveFlashDeals(
                latitude, longitude, categoryId, limit, cursor);
        return ResponseEntity.ok(ApiResponse.success("Flash deals fetched successfully", response));
    }

    @GetMapping("/{offerId}")
    @Operation(summary = "Get verified active offer details (Public)")
    public ResponseEntity<ApiResponse<CustomerOfferDetailResponse>> getOfferDetails(
            @PathVariable UUID offerId) {
        CustomerOfferDetailResponse response = offerService.getCustomerOfferDetails(offerId);
        return ResponseEntity.ok(ApiResponse.success("Offer fetched successfully", response));
    }
}
