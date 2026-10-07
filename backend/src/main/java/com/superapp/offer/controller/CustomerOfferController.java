package com.superapp.offer.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.offer.dto.CustomerOfferDetailResponse;
import com.superapp.offer.service.OfferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/offers")
@Tag(name = "Customer Offers", description = "Public customer endpoints for viewing verified active offers")
public class CustomerOfferController {

    private final OfferService offerService;

    public CustomerOfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @GetMapping("/{offerId}")
    @Operation(summary = "Get verified active offer details (Public)")
    public ResponseEntity<ApiResponse<CustomerOfferDetailResponse>> getOfferDetails(
            @PathVariable UUID offerId) {
        CustomerOfferDetailResponse response = offerService.getCustomerOfferDetails(offerId);
        return ResponseEntity.ok(ApiResponse.success("Offer fetched successfully", response));
    }
}
