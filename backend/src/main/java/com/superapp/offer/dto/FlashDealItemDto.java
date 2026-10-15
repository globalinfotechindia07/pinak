package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.Instant;

@Schema(description = "Flash deal ending soon item")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record FlashDealItemDto(
        @Schema(description = "Offer ID", example = "c0000000-0000-0000-0000-000000000021")
        String offerId,

        @Schema(description = "Product or deal headline", example = "India Gate Basmati Rice 5kg")
        String title,

        @Schema(description = "Product image URL")
        String imageUrl,

        @Schema(description = "Discount badge text", example = "45% OFF")
        String badgeText,

        @Schema(description = "Offer discount type", example = "PERCENTAGE_DISCOUNT")
        String offerType,

        @Schema(description = "Flash deal price details")
        PriceDetailsDto price,

        @Schema(description = "Campaign start timestamp")
        Instant startsAt,

        @Schema(description = "Campaign expiration timestamp")
        Instant endsAt,

        @Schema(description = "Remaining claim stock", example = "25")
        Integer remainingQuantity,

        @Schema(description = "Store branch ID")
        String branchId,

        @Schema(description = "Eligibility verification state", example = "CHECK_REQUIRED")
        String eligibilityStatus
) {
    public record PriceDetailsDto(
            String currency,
            BigDecimal sellingPrice,
            BigDecimal mrp
    ) {}
}
