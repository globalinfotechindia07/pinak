package com.superapp.discovery.service;

import com.superapp.category.entity.Category;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.common.config.RateLimitService;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.common.response.PaginationMeta;
import com.superapp.discovery.cache.DiscoveryCacheKeyGenerator;
import com.superapp.discovery.dto.*;
import com.superapp.discovery.mapper.DiscoveryMapper;
import com.superapp.discovery.repository.DiscoveryRepository;
import com.superapp.discovery.repository.NearbyStoreRow;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.discovery.validation.DiscoveryValidator;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.store.entity.City;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.repository.CityRepository;
import com.superapp.store.repository.StoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class DiscoveryServiceImpl implements DiscoveryService {

    private static final Logger log = LoggerFactory.getLogger(DiscoveryServiceImpl.class);

    private final DiscoveryRepository discoveryRepository;
    private final OfferRepository offerRepository;
    private final StoreRepository storeRepository;
    private final MerchantRepository merchantRepository;
    private final CategoryRepository categoryRepository;
    private final CityRepository cityRepository;
    private final DiscoveryValidator discoveryValidator;
    private final DiscoveryMapper discoveryMapper;
    private final DiscoveryCacheKeyGenerator cacheKeyGenerator;
    private final RateLimitService rateLimitService;
    private final CacheManager cacheManager;

    public DiscoveryServiceImpl(
            DiscoveryRepository discoveryRepository,
            OfferRepository offerRepository,
            StoreRepository storeRepository,
            MerchantRepository merchantRepository,
            CategoryRepository categoryRepository,
            CityRepository cityRepository,
            DiscoveryValidator discoveryValidator,
            DiscoveryMapper discoveryMapper,
            DiscoveryCacheKeyGenerator cacheKeyGenerator,
            RateLimitService rateLimitService,
            CacheManager cacheManager) {
        this.discoveryRepository = discoveryRepository;
        this.offerRepository = offerRepository;
        this.storeRepository = storeRepository;
        this.merchantRepository = merchantRepository;
        this.categoryRepository = categoryRepository;
        this.cityRepository = cityRepository;
        this.discoveryValidator = discoveryValidator;
        this.discoveryMapper = discoveryMapper;
        this.cacheKeyGenerator = cacheKeyGenerator;
        this.rateLimitService = rateLimitService;
        this.cacheManager = cacheManager;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<NearbyStoreResponse> getNearbyStores(NearbySearchQuery query, String clientIp) {
        checkRateLimit(clientIp);

        discoveryValidator.validateCoordinates(query.lat(), query.lng());
        discoveryValidator.validateRadius(query.radius());
        discoveryValidator.validateSort(query.sort());

        String cacheKey = cacheKeyGenerator.generateNearbyKey(query);
        PagedResult<NearbyStoreResponse> cached = getFromCache("discovery_nearby", cacheKey);
        if (cached != null) {
            log.debug("Cache HIT for nearby query: {}", cacheKey);
            return cached;
        }

        int size = discoveryValidator.clampPageSize(query.size());
        int page = query.getEffectivePage();
        int offset = page * size;
        double radius = query.getEffectiveRadius();
        boolean hasOffer = Boolean.TRUE.equals(query.hasOffer());
        boolean sortByDistance = query.isSortByDistance();
        Instant now = Instant.now();

        List<NearbyStoreRow> rows = discoveryRepository.findNearbyStores(
                query.lat(),
                query.lng(),
                radius,
                query.categoryId(),
                hasOffer,
                now,
                sortByDistance,
                size,
                offset
        );

        long total = discoveryRepository.countNearbyStores(
                query.lat(),
                query.lng(),
                radius,
                query.categoryId(),
                hasOffer,
                now
        );

        List<NearbyStoreResponse> content = rows.stream()
                .map(discoveryMapper::toNearbyResponse)
                .toList();

        int totalPages = (int) Math.ceil((double) total / size);
        PaginationMeta meta = PaginationMeta.of(page, size, total, totalPages);
        PagedResult<NearbyStoreResponse> result = PagedResult.of(content, meta);

        putInCache("discovery_nearby", cacheKey, result);
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<StoreSearchResponse> searchStores(StoreSearchQuery query, String clientIp) {
        checkRateLimit(clientIp);

        discoveryValidator.validateSearchKeyword(query.q());

        boolean hasCoordinates = query.hasCoordinates();
        if (hasCoordinates) {
            discoveryValidator.validateCoordinates(query.lat(), query.lng());
            discoveryValidator.validateRadius(query.radius());
        }

        int size = discoveryValidator.clampPageSize(query.size());
        int page = query.getEffectivePage();
        int offset = page * size;
        double lat = hasCoordinates ? query.lat() : 0.0;
        double lng = hasCoordinates ? query.lng() : 0.0;
        Double radius = query.radius() != null ? query.radius() : (hasCoordinates ? 50000.0 : null);
        Instant now = Instant.now();

        List<NearbyStoreRow> rows = discoveryRepository.searchStores(
                query.q(),
                query.categoryId(),
                hasCoordinates,
                lat,
                lng,
                radius,
                now,
                size,
                offset
        );

        long total = discoveryRepository.countSearchStores(
                query.q(),
                query.categoryId(),
                hasCoordinates,
                lat,
                lng,
                radius
        );

        List<StoreSearchResponse> content = rows.stream()
                .map(discoveryMapper::toSearchResponse)
                .toList();

        int totalPages = (int) Math.ceil((double) total / size);
        PaginationMeta meta = PaginationMeta.of(page, size, total, totalPages);
        return PagedResult.of(content, meta);
    }

    @Override
    @Transactional(readOnly = true)
    public StoreDiscoveryDetailResponse getStoreDetails(UUID storeId) {
        String cacheKey = cacheKeyGenerator.generateStoreDetailKey(storeId.toString());
        StoreDiscoveryDetailResponse cached = getFromCache("discovery_stores", cacheKey);
        if (cached != null) {
            log.debug("Cache HIT for store details: {}", cacheKey);
            return cached;
        }

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND));

        if (store.getApprovalStatus() != ApprovalStatus.APPROVED || store.getStatus() != StoreStatus.ACTIVE) {
            throw new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND);
        }

        Merchant merchant = merchantRepository.findById(store.getMerchantId())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND));

        if (merchant.getApprovalStatus() != ApprovalStatus.APPROVED || merchant.getStatus() != MerchantStatus.ACTIVE) {
            throw new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND);
        }

        Category category = null;
        if (merchant.getCategoryId() != null) {
            category = categoryRepository.findById(merchant.getCategoryId()).orElse(null);
        }

        City city = null;
        if (store.getCityId() != null) {
            city = cityRepository.findById(store.getCityId()).orElse(null);
        }

        StoreDiscoveryDetailResponse response = discoveryMapper.toDetailResponse(store, merchant, category, city);
        putInCache("discovery_stores", cacheKey, response);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<OfferResponse> getStoreOffers(UUID storeId, int page, int size) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND));

        if (store.getApprovalStatus() != ApprovalStatus.APPROVED || store.getStatus() != StoreStatus.ACTIVE) {
            throw new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND);
        }

        Merchant merchant = merchantRepository.findById(store.getMerchantId())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND));

        if (merchant.getApprovalStatus() != ApprovalStatus.APPROVED || merchant.getStatus() != MerchantStatus.ACTIVE) {
            throw new ResourceNotFoundException("Store not found", ApiError.STORE_NOT_FOUND);
        }

        int pageSize = discoveryValidator.clampPageSize(size);
        int pageIndex = Math.max(0, page);

        String cacheKey = cacheKeyGenerator.generateStoreOffersKey(storeId.toString(), pageIndex, pageSize);
        PagedResult<OfferResponse> cached = getFromCache("discovery_offers", cacheKey);
        if (cached != null) {
            log.debug("Cache HIT for store offers: {}", cacheKey);
            return cached;
        }

        Pageable pageable = PageRequest.of(pageIndex, pageSize);
        Page<Offer> offersPage = offerRepository.findActiveOffersByStoreOrMerchant(
                storeId,
                store.getMerchantId(),
                Instant.now(),
                pageable
        );

        List<OfferResponse> content = offersPage.getContent().stream()
                .map(OfferResponse::fromEntity)
                .toList();

        PaginationMeta meta = PaginationMeta.of(
                pageIndex,
                pageSize,
                offersPage.getTotalElements(),
                offersPage.getTotalPages()
        );
        PagedResult<OfferResponse> result = PagedResult.of(content, meta);

        putInCache("discovery_offers", cacheKey, result);
        return result;
    }

    private void checkRateLimit(String clientIp) {
        if (clientIp != null && !clientIp.isBlank()) {
            try {
                rateLimitService.checkLimit(RateLimitService.DISCOVERY, clientIp);
            } catch (Exception e) {
                // If it's RateLimitExceededException (AppException), it will re-throw
                if (e instanceof com.superapp.common.exception.AppException) {
                    throw e;
                }
                log.warn("Rate limit check failed for IP {}: {}", clientIp, e.getMessage());
            }
        }
    }

    @SuppressWarnings("unchecked")
    private <T> T getFromCache(String cacheName, String key) {
        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                Cache.ValueWrapper wrapper = cache.get(key);
                if (wrapper != null) {
                    return (T) wrapper.get();
                }
            }
        } catch (Exception e) {
            log.warn("Cache read failed for key '{}' in cache '{}': {}", key, cacheName, e.getMessage());
        }
        return null;
    }

    private void putInCache(String cacheName, String key, Object value) {
        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null && value != null) {
                cache.put(key, value);
            }
        } catch (Exception e) {
            log.warn("Cache write failed for key '{}' in cache '{}': {}", key, cacheName, e.getMessage());
        }
    }
}
