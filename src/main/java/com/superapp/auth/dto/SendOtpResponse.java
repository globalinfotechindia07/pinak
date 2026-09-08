package com.superapp.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response returned when OTP is sent")
public record SendOtpResponse(
        @Schema(description = "Recipient phone number", example = "+919876543210")
        String phone,

        @Schema(description = "OTP expiration time in seconds", example = "300")
        long expiresInSeconds,

        @Schema(description = "Cooldown time before new OTP can be requested", example = "60")
        long cooldownSeconds,

        @Schema(description = "Status message", example = "OTP sent successfully")
        String message
) {}
