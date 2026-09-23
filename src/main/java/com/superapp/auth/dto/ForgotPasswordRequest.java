package com.superapp.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ForgotPasswordRequest(
        @NotBlank(message = "Identifier (email or mobile) is required")
        @Size(max = 255, message = "Identifier must not exceed 255 characters")
        @Schema(description = "Email or phone number", example = "customer@superapp.com")
        String identifier
) {
    @JsonCreator
    public static ForgotPasswordRequest fromJson(
            @JsonProperty("identifier") String identifier,
            @JsonProperty("email") String email,
            @JsonProperty("phone") String phone,
            @JsonProperty("mobile") String mobile,
            @JsonProperty("phoneNumber") String phoneNumber
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
        return new ForgotPasswordRequest(resolved != null ? resolved.trim() : null);
    }
}
