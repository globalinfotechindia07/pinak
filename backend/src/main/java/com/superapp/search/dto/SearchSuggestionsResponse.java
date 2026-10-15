package com.superapp.search.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Response containing user query and list of matching suggestions")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SearchSuggestionsResponse(
        @Schema(description = "Original query string", example = "grill")
        String query,

        @Schema(description = "Matching suggestions across stores, categories, and offers")
        List<SearchSuggestionItemDto> suggestions
) {
}
