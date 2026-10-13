package com.superapp.mobile.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response returned after triggering a mobile OTP")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record MobileSendOtpResponse(
        @Schema(description = "Unique OTP challenge session ID", example = "otp_sess_a81d4e2b")
        String sessionId,

        @Schema(description = "Normalized E.164 phone number", example = "+919876543210")
        String phone,

        @Schema(description = "Channel used for OTP delivery", example = "SMS")
        String channel,

        @Schema(description = "Cooldown period in seconds before a resend is permitted", example = "60")
        long resendAvailableInSeconds,

        @Schema(description = "SIM binding verification status flag", example = "true")
        boolean simBindingVerified,

        @Schema(description = "6-digit OTP code returned for development and testing", example = "123456")
        String otp
) {
    // Backward compatibility constructor (defaults otp to null)
    public MobileSendOtpResponse(String sessionId, String phone, String channel, long resendAvailableInSeconds, boolean simBindingVerified) {
        this(sessionId, phone, channel, resendAvailableInSeconds, simBindingVerified, null);
    }
}
