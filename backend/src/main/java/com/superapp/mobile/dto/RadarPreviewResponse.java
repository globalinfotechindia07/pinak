package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Screen 09 Geo-Radar Preview Payload")
public record RadarPreviewResponse(
        @Schema(description = "Human-readable detected locality or city zone", example = "Indiranagar, Bangalore")
        String detectedZone,

        @Schema(description = "Total number of live partner stores in detected radius", example = "38")
        long nearbyMerchantCount,

        @Schema(description = "Hero banner discount highlight", example = "Up to 50% OFF live right now")
        String discountHighlight,

        @Schema(description = "Estimated device battery impact percentage", example = "5.0")
        double estimatedBatteryImpactPercentage,

        @Schema(description = "Sneak peek cards of top 2-3 nearby partner stores")
        List<NearbyStoreCardDto> nearbyStores,

        @Schema(description = "Privacy and security guarantee badge")
        PrivacyShieldDto privacyShield
) {}
