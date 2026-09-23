package com.superapp.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for login.
 * Seamlessly supports email or phone number (mobile), as well as generic 'identifier'.
 * 'deviceId' and 'deviceName' are optional but recommended for session tracking.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record LoginRequest(
        @NotBlank(message = "Identifier (email or mobile) is required")
        @Size(max = 255, message = "Identifier must not exceed 255 characters")
        @Schema(description = "User email or phone/mobile number (can also be passed as 'email', 'phone', or 'mobile')", example = "customer@superapp.com")
        String identifier,

        @NotBlank(message = "Password is required")
        @Size(max = 128, message = "Password must not exceed 128 characters")
        @Schema(description = "Account password", example = "Password@123")
        String password,

        @Size(max = 255, message = "Device ID must not exceed 255 characters")
        @Schema(description = "Optional client device ID for session tracking", example = "device-001")
        String deviceId,

        @Size(max = 255, message = "Device name must not exceed 255 characters")
        @Schema(description = "Optional client device name", example = "Pixel 8 Pro")
        String deviceName
) {
    @JsonCreator
    public static LoginRequest fromJson(
            @JsonProperty("identifier") String identifier,
            @JsonProperty("email") String email,
            @JsonProperty("phone") String phone,
            @JsonProperty("mobile") String mobile,
            @JsonProperty("phoneNumber") String phoneNumber,
            @JsonProperty("password") String password,
            @JsonProperty("deviceId") String deviceId,
            @JsonProperty("deviceName") String deviceName
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
        return new LoginRequest(
                resolved != null ? resolved.trim() : null,
                password,
                deviceId,
                deviceName
        );
    }

    public LoginRequest(String identifier, String password) {
        this(identifier, password, null, null);
    }
}
