package com.superapp.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Schema(description = "Request to verify phone OTP and authenticate/login")
public record VerifyPhoneOtpRequest(
        @Schema(description = "Phone number that received the OTP", example = "+919876543210")
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^\\+?[1-9]\\d{9,14}$", message = "Please enter a valid phone number")
        String phone,

        @Schema(description = "OTP Request ID returned by /api/v1/auth/otp/request", example = "otp_req_123")
        String otpRequestId,

        @Schema(description = "6-digit OTP code", example = "123456")
        @NotBlank(message = "OTP code is required")
        @Pattern(regexp = "^[0-9]{4,8}$", message = "OTP must be numeric (4 to 8 digits)")
        String otp,

        @Schema(description = "Optional client device ID", example = "device-abc-123")
        String deviceId,

        @Schema(description = "Optional device name or model", example = "Pixel 8")
        String deviceName
) {
    public VerifyPhoneOtpRequest(String phone, String otp, String deviceId, String deviceName) {
        this(phone, null, otp, deviceId, deviceName);
    }
}
