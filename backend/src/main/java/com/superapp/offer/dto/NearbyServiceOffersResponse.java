package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Response containing nearby service offers and pagination")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record NearbyServiceOffersResponse(
        @Schema(description = "List of top nearby service offers")
        List<NearbyServiceOfferItemDto> offers,

        @Schema(description = "Pagination metadata")
        DiscoverPaginationDto pagination
) {
}
