package com.superapp.interaction.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.interaction.dto.RecommendationsResponse;
import com.superapp.interaction.service.UserInteractionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recommendations")
@Tag(name = "Personalized Recommendations", description = "AI and heuristic recommendations based on location and user history")
public class RecommendationController {

    private final UserInteractionService interactionService;

    public RecommendationController(UserInteractionService interactionService) {
        this.interactionService = interactionService;
    }

    @GetMapping
    @Operation(summary = "Get personalized store and product recommendations", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RecommendationsResponse>> getRecommendations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String cursor) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        RecommendationsResponse response = interactionService.getRecommendations(userId, latitude, longitude, limit, cursor);

        return ResponseEntity.ok(ApiResponse.success("Recommendations fetched successfully", response));
    }
}
