package com.superapp.collection.dto;

import java.util.List;

public record PopularCollectionsResponse(
        List<PopularCollectionItemDto> collections
) {}
