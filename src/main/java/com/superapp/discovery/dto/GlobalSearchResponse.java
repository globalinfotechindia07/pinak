package com.superapp.discovery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.category.dto.CategoryTreeResponse;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GlobalSearchResponse(
        String query,
        int totalResults,
        List<StoreSearchResponse> stores,
        List<CategoryTreeResponse> categories,
        List<OfferResponse> offers
) {
    public static GlobalSearchResponse of(
            String query,
            List<StoreSearchResponse> stores,
            List<CategoryTreeResponse> categories,
            List<OfferResponse> offers
    ) {
        int count = (stores != null ? stores.size() : 0)
                + (categories != null ? categories.size() : 0)
                + (offers != null ? offers.size() : 0);
        return new GlobalSearchResponse(query, count, stores, categories, offers);
    }
}
