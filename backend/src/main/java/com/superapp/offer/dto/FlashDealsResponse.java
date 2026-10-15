package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Response containing active flash deals and pagination")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record FlashDealsResponse(
        @Schema(description = "List of active flash deals ending soon")
        List<FlashDealItemDto> deals,

        @Schema(description = "Pagination metadata")
        DiscoverPaginationDto pagination
) {
}
