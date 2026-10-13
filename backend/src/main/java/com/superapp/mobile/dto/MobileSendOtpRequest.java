package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request payload to trigger a mobile OTP")
public record MobileSendOtpRequest(
        @NotBlank(message = "Phone number is compulsory")
        @Schema(description = "Customer mobile number (10 digits or E.164 +91)", example = "+919876543210")
        String phone,

        @Schema(description = "Delivery channel (SMS or WHATSAPP)", example = "SMS", defaultValue = "SMS")
        String channel,

        @Schema(description = "User consent for WhatsApp transaction alerts", example = "true")
        Boolean whatsappAlertsEnabled,

        @Schema(description = "Soundbox / POS persistent session flag", example = "false")
        Boolean soundboxStaySignedIn,

        @Schema(description = "Optional referral code for signup bonus preview", example = "FRIEND100")
        String referralCode
) {}
