package com.superapp.store.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record UpdateStoreRequest(
        @NotBlank(message = "Store name must not be blank")
        @Size(min = 2, max = 255, message = "Store name must be between 2 and 255 characters")
        String storeName,

        @NotBlank(message = "Address must not be blank")
        @Size(min = 5, max = 512, message = "Address must be between 5 and 512 characters")
        String address,

        String cityId,

        @NotBlank(message = "State must not be blank")
        @Size(min = 2, max = 100, message = "State must be between 2 and 100 characters")
        String state,

        @NotBlank(message = "Pincode must not be blank")
        @Pattern(regexp = "^[0-9]{5,10}$", message = "Pincode must be between 5 and 10 digits")
        String pincode,

        @NotNull(message = "Latitude must not be null")
        @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
        @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
        BigDecimal latitude,

        @NotNull(message = "Longitude must not be null")
        @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
        @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
        BigDecimal longitude
) {
}
