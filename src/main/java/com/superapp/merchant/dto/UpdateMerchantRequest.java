package com.superapp.merchant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record UpdateMerchantRequest(
        @NotBlank(message = "Business name must not be blank")
        @Size(min = 2, max = 255, message = "Business name must be between 2 and 255 characters")
        String businessName,

        UUID categoryId
) {
}
