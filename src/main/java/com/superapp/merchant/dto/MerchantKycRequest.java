package com.superapp.merchant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MerchantKycRequest(
        @NotBlank(message = "Document type is required")
        @Size(max = 64, message = "Document type must not exceed 64 characters")
        String documentType,

        @NotBlank(message = "Document number is required")
        @Size(max = 128, message = "Document number must not exceed 128 characters")
        String documentNumber,

        @Size(max = 128, message = "Business registration number must not exceed 128 characters")
        String businessRegistrationNumber,

        @Size(max = 128, message = "Tax ID must not exceed 128 characters")
        String taxId,

        @Size(max = 1024, message = "Document URL must not exceed 1024 characters")
        @Pattern(regexp = "^(https?://|data:|urn:).*$", message = "Invalid document URL format")
        String documentUrl
) {
}
