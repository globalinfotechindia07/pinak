package com.superapp.store.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record MerchantCreateStoreRequest(
        @NotBlank(message = "Store name must not be blank")
        @Size(min = 2, max = 255, message = "Store name must be between 2 and 255 characters")
        String name,

        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,

        @NotBlank(message = "Address line 1 must not be blank")
        @Size(max = 255, message = "Address line 1 must not exceed 255 characters")
        String addressLine1,

        @Size(max = 255, message = "Address line 2 must not exceed 255 characters")
        String addressLine2,

        @NotBlank(message = "City ID is required")
        String cityId,

        @NotBlank(message = "State is required")
        @Size(min = 2, max = 100, message = "State must be between 2 and 100 characters")
        String state,

        @NotBlank(message = "Pincode is required")
        @Pattern(regexp = "^[0-9]{5,10}$", message = "Pincode must be between 5 and 10 digits")
        String pincode,

        @NotNull(message = "Latitude is required")
        @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
        @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
        BigDecimal latitude,

        @NotNull(message = "Longitude is required")
        @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
        @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
        BigDecimal longitude,

        @Pattern(regexp = "^[+]?[0-9]{7,20}$", message = "Invalid phone number format")
        String phone
) {
}
