package com.superapp.benefit.controller;

import com.superapp.benefit.dto.DiscoverBenefitsResponse;
import com.superapp.benefit.service.DiscoverBenefitService;
import com.superapp.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/discover")
@Tag(name = "Discover Benefits", description = "Why shop on PINAK platform value propositions")
public class DiscoverBenefitController {

    private final DiscoverBenefitService benefitService;

    public DiscoverBenefitController(DiscoverBenefitService benefitService) {
        this.benefitService = benefitService;
    }

    @GetMapping("/benefits")
    @Operation(summary = "Get platform benefits (Why Shop on PINAK?)", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DiscoverBenefitsResponse>> getBenefits() {
        DiscoverBenefitsResponse response = benefitService.getDiscoverBenefits();
        return ResponseEntity.ok(ApiResponse.success("Discover benefits fetched successfully", response));
    }
}
