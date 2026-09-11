package com.superapp.discovery.service;

import com.superapp.discovery.dto.*;

import java.util.UUID;

public interface DiscoveryService {

    PagedResult<NearbyStoreResponse> getNearbyStores(NearbySearchQuery query, String clientIp);

    PagedResult<StoreSearchResponse> searchStores(StoreSearchQuery query, String clientIp);

    StoreDiscoveryDetailResponse getStoreDetails(UUID storeId);

    PagedResult<OfferResponse> getStoreOffers(UUID storeId, int page, int size);
}
