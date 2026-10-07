package com.superapp.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Consolidated OTP Data Transfer Objects (Single File Architecture)
 * Encapsulates: Phone OTP, Email Verification OTP, OTP Challenges, and Password Reset OTP flows.
 */
public class OtpDTO {

    /**
     * Request to send OTP to mobile phone number.
     */
    @Schema(description = "Request to send OTP to mobile phone number")
    public record SendPhoneRequest(
            @Schema(description = "Mobile phone number with country code", example = "+919876543210")
            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = "^\\+?[1-9]\\d{9,14}$", message = "Please enter a valid phone number (10 to 15 digits, optional +)")
            String phone
    ) {}

    /**
     * Response returned when OTP is sent.
     */
    @Schema(description = "Response returned when OTP is sent")
    public record SendResponse(
            @Schema(description = "Recipient phone number", example = "+919876543210")
            String phone,

            @Schema(description = "OTP expiration time in seconds", example = "300")
            long expiresInSeconds,

            @Schema(description = "Cooldown time before new OTP can be requested", example = "60")
            long cooldownSeconds,

            @Schema(description = "Status message", example = "OTP sent successfully")
            String message
    ) {}

    /**
     * Request OTP challenge endpoint without leaking account existence.
     */
    public record RequestChallenge(
            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = "^[+]?[0-9]{7,20}$", message = "Invalid phone number format")
            String phone,

            String purpose,

            String deviceId
    ) {}

    /**
     * Response after OTP challenge is created.
     */
    public record ChallengeResponse(
            String otpRequestId,
            long expiresIn
    ) {}

    /**
     * Request to verify OTP challenge with otpRequestId.
     */
    public record VerifyChallengeRequest(
            @NotBlank(message = "Phone number is required")
            String phone,

            @NotBlank(message = "OTP request ID is required")
            String otpRequestId,

            @NotBlank(message = "OTP code is required")
            @Pattern(regexp = "^[0-9]{4,8}$", message = "Invalid OTP format")
            String otp,

            String deviceId
    ) {}

    /**
     * Request to verify phone OTP and authenticate/login.
     */
    @Schema(description = "Request to verify phone OTP and authenticate/login")
    public record VerifyPhoneRequest(
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
        public VerifyPhoneRequest(String phone, String otp, String deviceId, String deviceName) {
            this(phone, null, otp, deviceId, deviceName);
        }
    }

    /**
     * Generic single OTP code verification request.
     */
    public record VerifyRequest(
            @NotBlank(message = "OTP is required")
            @Size(min = 4, max = 10, message = "Invalid OTP format")
            String otp
    ) {}

    /**
     * Request to verify password reset OTP with identifier.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record VerifyResetPasswordRequest(
            @NotBlank(message = "Identifier (email or mobile) is required")
            @Schema(description = "Email or phone number", example = "customer@superapp.com")
            String identifier,

            @NotBlank(message = "OTP is required")
            @Size(min = 4, max = 10, message = "Invalid OTP format")
            @Schema(description = "OTP received on email or mobile", example = "123456")
            String otp
    ) {
        @JsonCreator
        public static VerifyResetPasswordRequest fromJson(
                @JsonProperty("identifier") String identifier,
                @JsonProperty("email") String email,
                @JsonProperty("phone") String phone,
                @JsonProperty("mobile") String mobile,
                @JsonProperty("phoneNumber") String phoneNumber,
                @JsonProperty("otp") String otp
        ) {
            String resolved = identifier;
            if (resolved == null || resolved.isBlank()) {
                if (email != null && !email.isBlank()) {
                    resolved = email;
                } else if (phone != null && !phone.isBlank()) {
                    resolved = phone;
                } else if (mobile != null && !mobile.isBlank()) {
                    resolved = mobile;
                } else if (phoneNumber != null && !phoneNumber.isBlank()) {
                    resolved = phoneNumber;
                }
            }
            return new VerifyResetPasswordRequest(resolved != null ? resolved.trim() : null, otp);
        }
    }

    /**
     * Response after password reset OTP is verified, providing reset token.
     */
    public record VerifyResetPasswordResponse(
            String resetToken
    ) {}
}
