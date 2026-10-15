package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Standard pagination metadata for Discover screen sections")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DiscoverPaginationDto(
        @Schema(description = "Requested page size limit", example = "10")
        Integer limit,

        @Schema(description = "Opaque cursor for fetching next page", example = "null")
        String nextCursor,

        @Schema(description = "Whether additional records exist", example = "false")
        Boolean hasMore
) {
    public static DiscoverPaginationDto of(int limit, boolean hasMore) {
        return new DiscoverPaginationDto(limit, null, hasMore);
    }
}
