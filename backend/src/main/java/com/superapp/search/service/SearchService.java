package com.superapp.search.service;

import com.superapp.search.dto.SearchSuggestionsResponse;

public interface SearchService {
    SearchSuggestionsResponse getSuggestions(String query, Double latitude, Double longitude, Integer limit);
}
