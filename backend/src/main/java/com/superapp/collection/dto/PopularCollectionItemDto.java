package com.superapp.collection.dto;

import java.util.List;

public record PopularCollectionItemDto(
        String collectionId,
        String title,
        String subtitle,
        String coverImageUrl,
        String badgeText,
        Integer displayOrder,
        String targetType,
        String targetId
) {}
