package com.superapp.interaction.service;

import com.superapp.interaction.dto.RecentlyViewedResponse;
import com.superapp.interaction.dto.RecommendationsResponse;
import com.superapp.interaction.dto.RecordRecentlyViewedRequest;

import java.util.UUID;

public interface UserInteractionService {

    void recordRecentlyViewed(UUID userId, RecordRecentlyViewedRequest request);

    RecentlyViewedResponse getRecentlyViewed(UUID userId, String type, Integer limit, String cursor);

    RecommendationsResponse getRecommendations(UUID userId, Double latitude, Double longitude, Integer limit, String cursor);
}
