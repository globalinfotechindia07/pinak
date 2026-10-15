package com.superapp.search.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.search.dto.SearchSuggestionsResponse;
import com.superapp.search.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/search")
@Tag(name = "Search", description = "Global commerce search suggestions across stores, categories, and offers")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/suggestions")
    @Operation(summary = "Search suggestions across shops, products, services and offers",
               description = "Queries real database tables for matching stores, categories, and offers with optional geo-distance calculation")
    public ResponseEntity<ApiResponse<SearchSuggestionsResponse>> getSearchSuggestions(
            @Parameter(description = "Search query string", required = true, example = "grill")
            @RequestParam String q,

            @Parameter(description = "Customer latitude for distance calculation", example = "12.9716")
            @RequestParam(required = false) Double latitude,

            @Parameter(description = "Customer longitude for distance calculation", example = "77.6412")
            @RequestParam(required = false) Double longitude,

            @Parameter(description = "Maximum suggestion items to return", example = "10")
            @RequestParam(required = false, defaultValue = "10") Integer limit) {

        SearchSuggestionsResponse response = searchService.getSuggestions(q, latitude, longitude, limit);
        return ResponseEntity.ok(ApiResponse.success("Search suggestions fetched successfully", response));
    }
}
