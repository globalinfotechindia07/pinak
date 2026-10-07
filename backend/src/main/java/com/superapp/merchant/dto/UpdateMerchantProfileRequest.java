package com.superapp.merchant.dto;

import com.superapp.merchant.validation.ValidBusinessName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record UpdateMerchantProfileRequest(
        @NotBlank(message = "Business name must not be blank")
        @Size(min = 2, max = 255, message = "Business name must be between 2 and 255 characters")
        @ValidBusinessName(message = "Business name contains invalid characters")
        String businessName,

        @Size(max = 255, message = "Legal name must not exceed 255 characters")
        String legalName,

        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,

        UUID categoryId,

        @Size(min = 7, max = 20, message = "Phone must be between 7 and 20 characters")
        @Pattern(regexp = "^[+]?[0-9]{7,20}$", message = "Invalid phone number format")
        String phone,

        @Email(message = "Invalid email address")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        String email,

        @Size(max = 255, message = "Website URL must not exceed 255 characters")
        String website
) {
}
