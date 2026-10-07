package com.superapp.user.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.mapper.CategoryMapper;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.category.service.CategoryServiceImpl;
import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.location.mapper.CityMapper;
import com.superapp.location.service.CityServiceImpl;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.mapper.MerchantMapper;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.merchant.service.MerchantServiceImpl;
import com.superapp.offer.dto.OfferApprovalResponse;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.mapper.OfferMapper;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.offer.service.OfferServiceImpl;
import com.superapp.offer.validation.OfferValidator;
import com.superapp.store.entity.City;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.CityStatus;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.mapper.StoreMapper;
import com.superapp.store.repository.CityRepository;
import com.superapp.store.repository.StoreRepository;
import com.superapp.store.service.StoreServiceImpl;
import com.superapp.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminWorkflowUnitTest {

    @Mock private StoreRepository storeRepository;
    @Mock private MerchantRepository merchantRepository;
    @Mock private CityRepository cityRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private OfferRepository offerRepository;
    @Mock private AuditService auditService;
    @Mock private CacheManager cacheManager;
    @Mock private OfferValidator offerValidator;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Nested
    @DisplayName("Store & Merchant Dependency Enforcement")
    class StoreMerchantDependencyTests {

        @Test
        @DisplayName("approveStore fails when parent merchant is suspended")
        void approveStore_failsWhenParentMerchantSuspended() {
            UUID storeId = UUID.randomUUID();
            UUID merchantId = UUID.randomUUID();
            UUID adminId = UUID.randomUUID();

            Store store = new Store();
            store.setId(storeId);
            store.setMerchantId(merchantId);
            store.setApprovalStatus(ApprovalStatus.PENDING);
            store.setStatus(StoreStatus.INACTIVE);

            Merchant merchant = new Merchant();
            merchant.setId(merchantId);
            merchant.setStatus(MerchantStatus.SUSPENDED);
            merchant.setApprovalStatus(ApprovalStatus.APPROVED);

            StoreServiceImpl storeService = new StoreServiceImpl(storeRepository, merchantRepository, cityRepository, auditService, new StoreMapper());

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
            when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));

            assertThatThrownBy(() -> storeService.approveStore(storeId, adminId))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("Cannot approve store because parent merchant is suspended or not approved");
        }

        @Test
        @DisplayName("activateStore fails when parent merchant is inactive")
        void activateStore_failsWhenParentMerchantInactive() {
            UUID storeId = UUID.randomUUID();
            UUID merchantId = UUID.randomUUID();
            UUID adminId = UUID.randomUUID();

            Store store = new Store();
            store.setId(storeId);
            store.setMerchantId(merchantId);
            store.setApprovalStatus(ApprovalStatus.APPROVED);
            store.setStatus(StoreStatus.SUSPENDED);

            Merchant merchant = new Merchant();
            merchant.setId(merchantId);
            merchant.setStatus(MerchantStatus.INACTIVE);

            StoreServiceImpl storeService = new StoreServiceImpl(storeRepository, merchantRepository, cityRepository, auditService, new StoreMapper());

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
            when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));

            assertThatThrownBy(() -> storeService.activateStore(storeId, "Reactivating", adminId))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("Cannot activate store because parent merchant is suspended or not approved");
        }

        @Test
        @DisplayName("activateStore succeeds when parent merchant is active")
        void activateStore_succeedsWhenParentMerchantActive() {
            UUID storeId = UUID.randomUUID();
            UUID merchantId = UUID.randomUUID();
            UUID adminId = UUID.randomUUID();

            Store store = new Store();
            store.setId(storeId);
            store.setMerchantId(merchantId);
            store.setApprovalStatus(ApprovalStatus.APPROVED);
            store.setStatus(StoreStatus.SUSPENDED);

            Merchant merchant = new Merchant();
            merchant.setId(merchantId);
            merchant.setStatus(MerchantStatus.ACTIVE);
            merchant.setApprovalStatus(ApprovalStatus.APPROVED);

            StoreServiceImpl storeService = new StoreServiceImpl(storeRepository, merchantRepository, cityRepository, auditService, new StoreMapper());

            when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
            when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
            when(storeRepository.save(any(Store.class))).thenAnswer(i -> i.getArgument(0));

            var response = storeService.activateStore(storeId, "Reactivation reason", adminId);
            assertThat(response).isNotNull();
            assertThat(store.getStatus()).isEqualTo(StoreStatus.ACTIVE);
            verify(auditService).record(eq(AuditEventType.STORE_REACTIVATED), eq(adminId), any(), any(), any(), any());
        }

        @Test
        @DisplayName("activateMerchant activates merchant and records audit")
        void activateMerchant_succeeds() {
            UUID merchantId = UUID.randomUUID();
            UUID adminId = UUID.randomUUID();

            Merchant merchant = new Merchant();
            merchant.setId(merchantId);
            merchant.setStatus(MerchantStatus.SUSPENDED);
            merchant.setApprovalStatus(ApprovalStatus.APPROVED);

            MerchantServiceImpl merchantService = new MerchantServiceImpl(
                    merchantRepository, categoryRepository, userRepository, null, auditService, new MerchantMapper(), mock(org.springframework.security.crypto.password.PasswordEncoder.class));

            when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
            when(merchantRepository.save(any(Merchant.class))).thenAnswer(i -> i.getArgument(0));

            var response = merchantService.activateMerchant(merchantId, "Fixed compliance", adminId);
            assertThat(response).isNotNull();
            assertThat(merchant.getStatus()).isEqualTo(MerchantStatus.ACTIVE);
            verify(auditService).record(eq(AuditEventType.MERCHANT_REACTIVATED), eq(adminId), any(), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("City Management Active Store Protection")
    class CityActiveStoreProtectionTests {

        @Test
        @DisplayName("deactivateCityAdmin throws when active stores are located in that city")
        void deactivateCityAdmin_throwsWhenActiveStoresPresent() {
            String cityId = "city-mumbai";
            City city = new City(cityId, "Mumbai", "Maharashtra", "India", CityStatus.ACTIVE);

            when(cityRepository.findById(cityId)).thenReturn(Optional.of(city));
            when(storeRepository.existsByCityIdAndStatus(cityId, StoreStatus.ACTIVE)).thenReturn(true);

            CityServiceImpl cityService = new CityServiceImpl(
                    cityRepository, new CityMapper(), auditService, objectMapper, storeRepository);

            assertThatThrownBy(() -> cityService.deactivateCityAdmin(cityId, "admin-1"))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("Cannot deactivate city with active stores");
        }

        @Test
        @DisplayName("deactivateCityAdmin succeeds when no active stores are in that city")
        void deactivateCityAdmin_succeedsWhenNoActiveStores() {
            String cityId = "city-nagpur";
            City city = new City(cityId, "Nagpur", "Maharashtra", "India", CityStatus.ACTIVE);

            when(cityRepository.findById(cityId)).thenReturn(Optional.of(city));
            when(storeRepository.existsByCityIdAndStatus(cityId, StoreStatus.ACTIVE)).thenReturn(false);
            when(cityRepository.save(any(City.class))).thenAnswer(i -> i.getArgument(0));

            CityServiceImpl cityService = new CityServiceImpl(
                    cityRepository, new CityMapper(), auditService, objectMapper, storeRepository);

            cityService.deactivateCityAdmin(cityId, "admin-1");
            assertThat(city.getStatus()).isEqualTo(CityStatus.INACTIVE);
            verify(auditService).record(eq(AuditEventType.CITY_DEACTIVATED), any(), any(), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("Category and Offer Admin Operations")
    class CategoryAndOfferOperationsTest {

        @Test
        @DisplayName("updateCategoryStatusAdmin updates status and records audit")
        void updateCategoryStatusAdmin_succeeds() {
            UUID catId = UUID.randomUUID();
            Category category = new Category();
            category.setId(catId);
            category.setName("Electronics");
            category.setSlug("electronics");
            category.setStatus(CategoryStatus.ACTIVE);

            when(categoryRepository.findById(catId)).thenReturn(Optional.of(category));
            when(categoryRepository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));

            CategoryServiceImpl categoryService = new CategoryServiceImpl(
                    categoryRepository, new CategoryMapper(), auditService, objectMapper);

            var response = categoryService.updateCategoryStatusAdmin(catId, CategoryStatus.INACTIVE, "admin-1");
            assertThat(response).isNotNull();
            assertThat(category.getStatus()).isEqualTo(CategoryStatus.INACTIVE);
            verify(auditService).record(eq(AuditEventType.CATEGORY_DEACTIVATED), any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("suspendOffer deactivates offer and records audit")
        void suspendOffer_succeeds() {
            UUID offerId = UUID.randomUUID();
            UUID adminId = UUID.randomUUID();

            Offer offer = new Offer();
            offer.setId(offerId);
            offer.setStatus(OfferStatus.ACTIVE);

            when(offerRepository.findById(offerId)).thenReturn(Optional.of(offer));
            when(offerRepository.save(any(Offer.class))).thenAnswer(i -> i.getArgument(0));

            OfferServiceImpl offerService = new OfferServiceImpl(
                    offerRepository, merchantRepository, storeRepository,
                    offerValidator, new OfferMapper(), auditService, cacheManager);

            OfferApprovalResponse response = offerService.suspendOffer(offerId, "Terms violation", adminId);
            assertThat(response).isNotNull();
            assertThat(offer.getStatus()).isEqualTo(OfferStatus.DEACTIVATED);
            assertThat(offer.getRejectionReason()).isEqualTo("Terms violation");
            verify(auditService).record(eq(AuditEventType.OFFER_DEACTIVATED), eq(adminId), any(), any(), any(), any());
        }
    }
}
