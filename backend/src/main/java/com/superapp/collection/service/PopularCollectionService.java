package com.superapp.collection.service;

import com.superapp.collection.dto.PopularCollectionsResponse;

public interface PopularCollectionService {
    PopularCollectionsResponse getPopularCollections(Integer limit, String cursor);
}
