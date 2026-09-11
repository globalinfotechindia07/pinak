package com.superapp.discovery;

import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.common.config.RateLimitService;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.discovery.cache.DiscoveryCacheKeyGenerator;
import com.superapp.discovery.dto.*;
import com.superapp.discovery.mapper.DiscoveryMapper;
import com.superapp.discovery.repository.DiscoveryRepository;
import com.superapp.discovery.repository.NearbyStoreRow;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.enums.OfferType;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.discovery.service.DiscoveryServiceImpl;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscoveryServiceTest {

    @Mock
    private DiscoveryRepository discoveryRepository;
    @Mock
    private OfferRepository offerRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private MerchantRepository merchantRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private CityRepository cityRepository;
    @Mock
    private RateLimitService rateLimitService;
    @Mock
    private CacheManager cacheManager;
    @Mock
    private Cache cache;

    private DiscoveryValidator validator;
    private DiscoveryMapper mapper;
    private DiscoveryCacheKeyGenerator keyGenerator;
    private DiscoveryServiceImpl service;

    private UUID storeId;
    private UUID merchantId;
    private UUID categoryId;

    @BeforeEach
    void setUp() {
        validator = new DiscoveryValidator(50000.0, 10.0, 100);
        mapper = new DiscoveryMapper();
        keyGenerator = new DiscoveryCacheKeyGenerator();

        service = new DiscoveryServiceImpl(
                discoveryRepository,
                offerRepository,
                storeRepository,
                merchantRepository,
                categoryRepository,
                cityRepository,
                validator,
                mapper,
                keyGenerator,
                rateLimitService,
                cacheManager
        );

        storeId = UUID.randomUUID();
        merchantId = UUID.randomUUID();
        categoryId = UUID.randomUUID();
    }

    @Test
    @DisplayName("getNearbyStores returns stores and pagination metadata")
    void getNearbyStores_success() {
        NearbyStoreRow row = mock(NearbyStoreRow.class);
        when(row.getStoreId()).thenReturn(storeId);
        when(row.getMerchantId()).thenReturn(merchantId);
        when(row.getMerchantName()).thenReturn("Gourmet Foods");
        when(row.getStoreName()).thenReturn("Gourmet Main");
        when(row.getCategoryId()).thenReturn(categoryId);
        when(row.getCategoryName()).thenReturn("Dining");
        when(row.getAddressLine1()).thenReturn("101 High Street");
        when(row.getCityName()).thenReturn("Pune");
        when(row.getState()).thenReturn("Maharashtra");
        when(row.getPincode()).thenReturn("411001");
        when(row.getLatitude()).thenReturn(18.5204);
        when(row.getLongitude()).thenReturn(73.8567);
        when(row.getDistanceMeters()).thenReturn(1250.5);
        when(row.getHasActiveOffers()).thenReturn(true);

        when(cacheManager.getCache("discovery_nearby")).thenReturn(null);
        when(discoveryRepository.findNearbyStores(anyDouble(), anyDouble(), anyDouble(), any(), anyBoolean(), any(), anyBoolean(), anyInt(), anyInt()))
                .thenReturn(List.of(row));
        when(discoveryRepository.countNearbyStores(anyDouble(), anyDouble(), anyDouble(), any(), anyBoolean(), any()))
                .thenReturn(1L);

        NearbySearchQuery query = new NearbySearchQuery(18.52, 73.85, 5000.0, null, false, null, 0, 20, "distance");
        PagedResult<NearbyStoreResponse> result = service.getNearbyStores(query, "127.0.0.1");

        assertNotNull(result);
        assertEquals(1, result.content().size());
        NearbyStoreResponse store = result.content().get(0);
        assertEquals(storeId.toString(), store.id());
        assertEquals("Gourmet Main", store.name());
        assertEquals("Gourmet Foods", store.merchantName());
        assertEquals(1250.5, store.distanceMeters());
        assertTrue(store.hasActiveOffers());

        assertEquals(0, result.meta().page());
        assertEquals(20, result.meta().size());
        assertEquals(1L, result.meta().totalElements());
        assertEquals(1, result.meta().totalPages());
    }

    @Test
    @DisplayName("searchStores returns matches")
    void searchStores_success() {
        NearbyStoreRow row = mock(NearbyStoreRow.class);
        when(row.getStoreId()).thenReturn(storeId);
        when(row.getMerchantId()).thenReturn(merchantId);
        when(row.getMerchantName()).thenReturn("Bakery Delight");
        when(row.getStoreName()).thenReturn("Delight Express");
        when(row.getCategoryId()).thenReturn(categoryId);
        when(row.getCategoryName()).thenReturn("Bakery");
        when(row.getLatitude()).thenReturn(18.52);
        when(row.getLongitude()).thenReturn(73.85);
        when(row.getDistanceMeters()).thenReturn(500.0);

        when(discoveryRepository.searchStores(any(), any(), anyBoolean(), anyDouble(), anyDouble(), any(), any(), anyInt(), anyInt()))
                .thenReturn(List.of(row));
        when(discoveryRepository.countSearchStores(any(), any(), anyBoolean(), anyDouble(), anyDouble(), any()))
                .thenReturn(1L);

        StoreSearchQuery query = new StoreSearchQuery("Bakery", null, 18.52, 73.85, 5000.0, 0, 20);
        PagedResult<StoreSearchResponse> result = service.searchStores(query, "127.0.0.1");

        assertNotNull(result);
        assertEquals(1, result.content().size());
        StoreSearchResponse store = result.content().get(0);
        assertEquals(storeId.toString(), store.id());
        assertEquals("Delight Express", store.name());
        assertEquals("Bakery Delight", store.merchantName());
        assertEquals(500.0, store.distanceMeters());
    }

    @Test
    @DisplayName("getStoreDetails returns safe customer details when approved and active")
    void getStoreDetails_success() {
        Store store = new Store();
        store.setId(storeId);
        store.setMerchantId(merchantId);
        store.setStoreName("Pune Central");
        store.setDescription("Flagship department store");
        store.setAddressLine1("Seasons Mall");
        store.setAddress("Seasons Mall, Magarpatta");
        store.setState("Maharashtra");
        store.setPincode("411028");
        store.setLatitude(BigDecimal.valueOf(18.5204));
        store.setLongitude(BigDecimal.valueOf(73.8567));
        store.setPhone("+919876543210");
        store.setApprovalStatus(ApprovalStatus.APPROVED);
        store.setStatus(StoreStatus.ACTIVE);

        Merchant merchant = new Merchant();
        merchant.setId(merchantId);
        merchant.setBusinessName("Retail Brands Ltd");
        merchant.setCategoryId(categoryId);
        merchant.setApprovalStatus(ApprovalStatus.APPROVED);
        merchant.setStatus(MerchantStatus.ACTIVE);

        Category category = new Category();
        category.setId(categoryId);
        category.setName("Shopping");

        when(cacheManager.getCache("discovery_stores")).thenReturn(null);
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));

        StoreDiscoveryDetailResponse response = service.getStoreDetails(storeId);

        assertNotNull(response);
        assertEquals(storeId.toString(), response.id());
        assertEquals("Pune Central", response.name());
        assertEquals("Retail Brands Ltd", response.merchant().name());
        assertEquals("Shopping", response.category().name());
        assertEquals("+919876543210", response.phone());
        assertEquals("ACTIVE", response.status());
    }

    @Test
    @DisplayName("getStoreDetails throws STORE_NOT_FOUND if store doesn't exist")
    void getStoreDetails_notFound_throwsException() {
        when(cacheManager.getCache("discovery_stores")).thenReturn(null);
        when(storeRepository.findById(storeId)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> service.getStoreDetails(storeId));
        assertEquals(ApiError.STORE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("getStoreDetails throws STORE_NOT_FOUND if store is not approved")
    void getStoreDetails_unapproved_throwsException() {
        Store store = new Store();
        store.setId(storeId);
        store.setMerchantId(merchantId);
        store.setApprovalStatus(ApprovalStatus.PENDING);
        store.setStatus(StoreStatus.ACTIVE);

        when(cacheManager.getCache("discovery_stores")).thenReturn(null);
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> service.getStoreDetails(storeId));
        assertEquals(ApiError.STORE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("getStoreDetails throws STORE_NOT_FOUND if merchant is inactive")
    void getStoreDetails_inactiveMerchant_throwsException() {
        Store store = new Store();
        store.setId(storeId);
        store.setMerchantId(merchantId);
        store.setApprovalStatus(ApprovalStatus.APPROVED);
        store.setStatus(StoreStatus.ACTIVE);

        Merchant merchant = new Merchant();
        merchant.setId(merchantId);
        merchant.setApprovalStatus(ApprovalStatus.APPROVED);
        merchant.setStatus(MerchantStatus.INACTIVE);

        when(cacheManager.getCache("discovery_stores")).thenReturn(null);
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> service.getStoreDetails(storeId));
        assertEquals(ApiError.STORE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("getStoreOffers returns active valid offers for store")
    void getStoreOffers_success() {
        Store store = new Store();
        store.setId(storeId);
        store.setMerchantId(merchantId);
        store.setApprovalStatus(ApprovalStatus.APPROVED);
        store.setStatus(StoreStatus.ACTIVE);

        Merchant merchant = new Merchant();
        merchant.setId(merchantId);
        merchant.setApprovalStatus(ApprovalStatus.APPROVED);
        merchant.setStatus(MerchantStatus.ACTIVE);

        Offer offer = new Offer();
        offer.setId(UUID.randomUUID());
        offer.setMerchantId(merchantId);
        offer.setStoreId(storeId);
        offer.setTitle("20% OFF");
        offer.setDescription("Flat 20% off on all items");
        offer.setType(OfferType.PERCENTAGE_DISCOUNT);
        offer.setValue(BigDecimal.valueOf(20.0));
        offer.setStatus(OfferStatus.ACTIVE);
        offer.setValidFrom(Instant.now().minus(1, ChronoUnit.DAYS));
        offer.setValidTo(Instant.now().plus(7, ChronoUnit.DAYS));

        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(cacheManager.getCache("discovery_offers")).thenReturn(null);
        when(offerRepository.findActiveOffersByStoreOrMerchant(eq(storeId), eq(merchantId), any(), any()))
                .thenReturn(new PageImpl<>(List.of(offer), PageRequest.of(0, 20), 1));

        PagedResult<OfferResponse> result = service.getStoreOffers(storeId, 0, 20);

        assertNotNull(result);
        assertEquals(1, result.content().size());
        assertEquals("20% OFF", result.content().get(0).title());
        assertEquals("PERCENTAGE_DISCOUNT", result.content().get(0).type());
        assertEquals(BigDecimal.valueOf(20.0), result.content().get(0).value());
    }
}
