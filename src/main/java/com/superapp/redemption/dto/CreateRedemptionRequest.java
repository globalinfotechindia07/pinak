package com.superapp.redemption.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateRedemptionRequest(
        @NotNull(message = "Offer ID must not be null")
        UUID offerId,

        UUID storeId,

        @NotNull(message = "Bill amount must not be null")
        @DecimalMin(value = "1.00", message = "Bill amount must be at least 1.00")
        BigDecimal billAmount,

        @DecimalMin(value = "0.0", message = "Discount percentage cannot be negative")
        BigDecimal discountPercentage
) {
}
