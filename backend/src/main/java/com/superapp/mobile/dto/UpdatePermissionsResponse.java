package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response confirming location permissions consent")
public record UpdatePermissionsResponse(
        @Schema(description = "Whether the user has completed full onboarding", example = "true")
        boolean onboardingComplete,

        @Schema(description = "Active detected user zone", example = "Indiranagar, Bangalore")
        String userZone,

        @Schema(description = "Count of active live deals in user zone", example = "38")
        int activeOffersCount,

        @Schema(description = "Routing key for the next screen in the mobile app", example = "HOME_DASHBOARD")
        String nextScreen
) {}
