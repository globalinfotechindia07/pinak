package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class AdminBannerDtos {

    private AdminBannerDtos() {}

    @Schema(description = "Payload to create a hero promotional banner")
    public record CreateBannerRequest(
            @NotBlank(message = "Title is required")
            @Size(max = 255, message = "Title cannot exceed 255 characters")
            String title,

            @Size(max = 500, message = "Subtitle cannot exceed 500 characters")
            String subtitle,

            @NotBlank(message = "Badge text is required")
            @Size(max = 100, message = "Badge text cannot exceed 100 characters")
            String badgeText,

            @Size(max = 1024, message = "Image URL cannot exceed 1024 characters")
            String imageUrl,

            String ctaText,

            String ctaAction,

            String ctaTargetId,

            String themeStyle,

            Integer displayOrder,

            Instant countdownEndTime,

            Boolean isActive
    ) {}

    @Schema(description = "Payload to update a hero promotional banner")
    public record UpdateBannerRequest(
            @NotBlank(message = "Title is required")
            @Size(max = 255, message = "Title cannot exceed 255 characters")
            String title,

            @Size(max = 500, message = "Subtitle cannot exceed 500 characters")
            String subtitle,

            @NotBlank(message = "Badge text is required")
            @Size(max = 100, message = "Badge text cannot exceed 100 characters")
            String badgeText,

            @Size(max = 1024, message = "Image URL cannot exceed 1024 characters")
            String imageUrl,

            String ctaText,

            String ctaAction,

            String ctaTargetId,

            String themeStyle,

            Integer displayOrder,

            Instant countdownEndTime,

            Boolean isActive
    ) {}

    @Schema(description = "Detailed banner response for admin CMS")
    public record BannerDetailResponse(
            UUID id,
            String title,
            String subtitle,
            String badgeText,
            String imageUrl,
            String ctaText,
            String ctaAction,
            String ctaTargetId,
            String themeStyle,
            Integer displayOrder,
            Instant countdownEndTime,
            Boolean isActive,
            Instant createdAt,
            Instant updatedAt
    ) {}
}
