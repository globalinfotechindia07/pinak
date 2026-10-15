package com.superapp.category.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Category discovery list response matching mobile Discover screen specification")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CategoryListResponse(
        @Schema(description = "List of categories")
        List<CategoryResponse> categories
) {
}
