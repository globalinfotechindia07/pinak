package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Customer location and alert permissions consent payload")
public record UpdatePermissionsRequest(
        @Schema(description = "Whether user granted device precise GPS location", example = "true")
        Boolean preciseLocationGranted,

        @Schema(description = "Whether user consented to audio flash alerts and soundbox deals", example = "true")
        Boolean flashAlertsGranted,

        @Schema(description = "Current device latitude", example = "12.9716")
        Double latitude,

        @Schema(description = "Current device longitude", example = "77.6412")
        Double longitude
) {}
