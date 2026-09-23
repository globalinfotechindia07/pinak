package com.superapp.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VerifyResetOtpRequest(
        @NotBlank(message = "Identifier (email or mobile) is required")
        @Schema(description = "Email or phone number", example = "customer@superapp.com")
        String identifier,

        @NotBlank(message = "OTP is required")
        @Size(min = 4, max = 10, message = "Invalid OTP format")
        @Schema(description = "OTP received on email or mobile", example = "123456")
        String otp
) {
    @JsonCreator
    public static VerifyResetOtpRequest fromJson(
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
        return new VerifyResetOtpRequest(resolved != null ? resolved.trim() : null, otp);
    }
}
