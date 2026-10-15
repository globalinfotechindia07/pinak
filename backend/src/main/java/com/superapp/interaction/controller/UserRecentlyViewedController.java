package com.superapp.interaction.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.interaction.dto.RecentlyViewedResponse;
import com.superapp.interaction.dto.RecordRecentlyViewedRequest;
import com.superapp.interaction.service.UserInteractionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users/me/recently-viewed")
@Tag(name = "User Recently Viewed", description = "User browsing history for products and merchants")
public class UserRecentlyViewedController {

    private final UserInteractionService interactionService;

    public UserRecentlyViewedController(UserInteractionService interactionService) {
        this.interactionService = interactionService;
    }

    @GetMapping
    @Operation(summary = "Get user's recently viewed products and stores", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RecentlyViewedResponse>> getRecentlyViewed(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String cursor) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        RecentlyViewedResponse response = interactionService.getRecentlyViewed(userId, type, limit, cursor);

        return ResponseEntity.ok(ApiResponse.success("Recently viewed items fetched successfully", response));
    }

    @PostMapping
    @Operation(summary = "Record a product or merchant view in user history", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> recordRecentlyViewed(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RecordRecentlyViewedRequest request) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        interactionService.recordRecentlyViewed(userId, request);

        return ResponseEntity.ok(ApiResponse.success("View interaction recorded successfully", null));
    }
}
