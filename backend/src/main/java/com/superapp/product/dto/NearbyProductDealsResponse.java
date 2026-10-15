package com.superapp.product.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.offer.dto.DiscoverPaginationDto;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Response containing nearby product deals and pagination")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record NearbyProductDealsResponse(
        @Schema(description = "List of nearby product deals")
        List<NearbyProductDealItemDto> products,

        @Schema(description = "Pagination metadata")
        DiscoverPaginationDto pagination
) {
}
