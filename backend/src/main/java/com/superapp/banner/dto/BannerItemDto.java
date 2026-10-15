package com.superapp.banner.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(description = "Promotional carousel hero banner")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record BannerItemDto(
        @Schema(description = "Unique banner ID", example = "e0000000-0000-0000-0000-000000000001")
        String bannerId,

        @Schema(description = "Banner main headline", example = "Super Weekend Fest")
        String title,

        @Schema(description = "Banner subheading", example = "Flat 50% Cashback + 200 Extra Coins")
        String subtitle,

        @Schema(description = "Banner descriptive details", example = "Valid at all verified dining & salon partners in Indiranagar.")
        String description,

        @Schema(description = "CDN image URL", example = "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80")
        String imageUrl,

        @Schema(description = "Background hex color or gradient token", example = "#5B21B6")
        String backgroundColor,

        @Schema(description = "Badge label", example = "WEEKEND SUPER FEST")
        String badgeText,

        @Schema(description = "Call to action button text", example = "Claim Pass")
        String ctaText,

        @Schema(description = "Action trigger type", example = "CAMPAIGN")
        String actionType,

        @Schema(description = "Target campaign or resource ID", example = "cmp_1001")
        String actionId,

        @Schema(description = "Mobile deep link URI", example = "pinak://campaign/cmp_1001")
        String deeplink,

        @Schema(description = "Display sequence order", example = "1")
        Integer displayOrder,

        @Schema(description = "Campaign start timestamp")
        Instant startsAt,

        @Schema(description = "Campaign expiration timestamp")
        Instant endsAt
) {
}
