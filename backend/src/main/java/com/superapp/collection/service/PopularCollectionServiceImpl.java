package com.superapp.collection.service;

import com.superapp.collection.dto.PopularCollectionItemDto;
import com.superapp.collection.dto.PopularCollectionsResponse;
import com.superapp.collection.entity.PopularCollection;
import com.superapp.collection.repository.PopularCollectionRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PopularCollectionServiceImpl implements PopularCollectionService {

    private final PopularCollectionRepository collectionRepository;

    public PopularCollectionServiceImpl(PopularCollectionRepository collectionRepository) {
        this.collectionRepository = collectionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PopularCollectionsResponse getPopularCollections(Integer limit, String cursor) {
        int limitVal = (limit != null && limit > 0 && limit <= 50) ? limit : 10;
        List<PopularCollection> list = collectionRepository.findActiveCollections(PageRequest.of(0, limitVal));

        List<PopularCollectionItemDto> dtos = list.stream().map(c -> new PopularCollectionItemDto(
                c.getId().toString(),
                c.getTitle(),
                c.getSubtitle(),
                c.getCoverImageUrl(),
                c.getBadgeText(),
                c.getDisplayOrder(),
                c.getTargetType(),
                c.getTargetId() != null ? c.getTargetId().toString() : null
        )).toList();

        return new PopularCollectionsResponse(dtos);
    }
}
