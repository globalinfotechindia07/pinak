package com.superapp.store;

import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.store.dto.*;
import com.superapp.store.entity.City;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.CityStatus;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.mapper.StoreMapper;
import com.superapp.store.repository.CityRepository;
import com.superapp.store.repository.StoreRepository;
import com.superapp.store.service.StoreServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StoreServiceTest {

    @Mock private StoreRepository storeRepository;
    @Mock private MerchantRepository merchantRepository;
    @Mock private CityRepository cityRepository;
    @Mock private AuditService auditService;
    @Spy private StoreMapper storeMapper = new StoreMapper();

    @InjectMocks private StoreServiceImpl storeService;

    private UUID merchantId;
    private UUID ownerId;
    private Merchant merchant;
    private UUID storeId;
    private Store store;
    private City city;

    @BeforeEach
    void setUp() {
        merchantId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
        merchant = new Merchant(ownerId, "ABC Brands", null);
        merchant.setId(merchantId);

        storeId = UUID.randomUUID();
        store = new Store(
                merchantId,
                "Pune Store",
                "123 FC Road",
                "PUNE",
                "Maharashtra",
                "411004",
                new BigDecimal("18.5204"),
                new BigDecimal("73.8567")
        );
        store.setId(storeId);
        store.setStatus(StoreStatus.ACTIVE);
        store.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);

        city = new City("PUNE", "Pune", "Maharashtra", "India", CityStatus.ACTIVE);
    }

    @Test
    @DisplayName("Create merchant store derives merchant from user context and sets PENDING_APPROVAL")
    void createMerchantStore_success() {
        MerchantCreateStoreRequest request = new MerchantCreateStoreRequest(
                "ABC Retail - Dharampeth",
                "ABC Retail Dharampeth Branch",
                "123 Main Road",
                "Near Market",
                "PUNE",
                "Maharashtra",
                "440010",
                new BigDecimal("21.1458"),
                new BigDecimal("79.0882"),
                "+919876543210"
        );

        when(merchantRepository.findByOwnerUserId(ownerId)).thenReturn(Optional.of(merchant));
        when(cityRepository.findById("PUNE")).thenReturn(Optional.of(city));
        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> {
            Store s = inv.getArgument(0);
            s.setId(storeId);
            return s;
        });

        StoreResponse response = storeService.createMerchantStore(request, ownerId);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("ABC Retail - Dharampeth");
        assertThat(response.merchantId()).isEqualTo(merchantId.toString());
        assertThat(response.status()).isEqualTo("ACTIVE");
        assertThat(response.approvalStatus()).isEqualTo("PENDING_APPROVAL");
        assertThat(response.latitude()).isEqualTo(new BigDecimal("21.1458"));
        assertThat(response.longitude()).isEqualTo(new BigDecimal("79.0882"));
    }

    @Test
    @DisplayName("Create store rejects invalid coordinates outside range")
    void createMerchantStore_invalidCoordinates_throwsException() {
        MerchantCreateStoreRequest invalidLat = new MerchantCreateStoreRequest(
                "ABC Retail", "Desc", "123 Main", null, "PUNE", "MH", "440010",
                new BigDecimal("95.0000"), new BigDecimal("79.0882"), null
        );

        when(merchantRepository.findByOwnerUserId(ownerId)).thenReturn(Optional.of(merchant));

        assertThatThrownBy(() -> storeService.createMerchantStore(invalidLat, ownerId))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Latitude must be between -90 and 90");
    }

    @Test
    @DisplayName("Create store rejects inactive city")
    void createMerchantStore_inactiveCity_throwsException() {
        City inactiveCity = new City("INACTIVE_CITY", "Old City", "MH", "India", CityStatus.INACTIVE);
        MerchantCreateStoreRequest request = new MerchantCreateStoreRequest(
                "ABC Retail", "Desc", "123 Main", null, "INACTIVE_CITY", "MH", "440010",
                new BigDecimal("21.1458"), new BigDecimal("79.0882"), null
        );

        when(merchantRepository.findByOwnerUserId(ownerId)).thenReturn(Optional.of(merchant));
        when(cityRepository.findById("INACTIVE_CITY")).thenReturn(Optional.of(inactiveCity));

        assertThatThrownBy(() -> storeService.createMerchantStore(request, ownerId))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("City is not active");
    }

    @Test
    @DisplayName("Get merchant store by ID fails with 403 when store belongs to another merchant (IDOR)")
    void getMerchantStoreById_otherMerchantStore_throwsForbidden() {
        UUID otherMerchantId = UUID.randomUUID();
        Store otherStore = new Store(otherMerchantId, "Other Store", "Address", "PUNE", "MH", "411001",
                new BigDecimal("18.5204"), new BigDecimal("73.8567"));
        otherStore.setId(UUID.randomUUID());

        when(merchantRepository.findByOwnerUserId(ownerId)).thenReturn(Optional.of(merchant));
        when(storeRepository.findById(otherStore.getId())).thenReturn(Optional.of(otherStore));

        assertThatThrownBy(() -> storeService.getMerchantStoreById(otherStore.getId(), ownerId))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("permission to access this store");
    }

    @Test
    @DisplayName("Update merchant store with location change resets approval status to PENDING_APPROVAL")
    void updateMerchantStore_locationChanged_triggersPendingApproval() {
        store.setApprovalStatus(ApprovalStatus.APPROVED);

        MerchantUpdateStoreRequest request = new MerchantUpdateStoreRequest(
                "Pune Store Updated", "New Desc", "456 New Road", null, "PUNE", "Maharashtra", "411004",
                new BigDecimal("18.5500"), new BigDecimal("73.8900"), "+919876543210"
        );

        when(merchantRepository.findByOwnerUserId(ownerId)).thenReturn(Optional.of(merchant));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(cityRepository.findById("PUNE")).thenReturn(Optional.of(city));
        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> inv.getArgument(0));

        StoreResponse response = storeService.updateMerchantStore(storeId, request, ownerId);

        assertThat(response.approvalStatus()).isEqualTo("PENDING_APPROVAL");
        assertThat(store.getApprovalStatus()).isEqualTo(ApprovalStatus.PENDING_APPROVAL);
    }

    @Test
    @DisplayName("Submit store for approval transitions status to PENDING_APPROVAL")
    void submitStoreForApproval_success() {
        store.setApprovalStatus(ApprovalStatus.DRAFT);

        when(merchantRepository.findByOwnerUserId(ownerId)).thenReturn(Optional.of(merchant));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> inv.getArgument(0));

        StoreApprovalActionResponse response = storeService.submitStoreForApproval(storeId, ownerId);

        assertThat(response.approvalStatus()).isEqualTo("PENDING_APPROVAL");
        assertThat(store.getApprovalStatus()).isEqualTo(ApprovalStatus.PENDING_APPROVAL);
    }

    @Test
    @DisplayName("Submit store for approval throws 409 Conflict if already APPROVED")
    void submitStoreForApproval_alreadyApproved_throwsConflict() {
        store.setApprovalStatus(ApprovalStatus.APPROVED);

        when(merchantRepository.findByOwnerUserId(ownerId)).thenReturn(Optional.of(merchant));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));

        assertThatThrownBy(() -> storeService.submitStoreForApproval(storeId, ownerId))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("already approved");
    }

    @Test
    @DisplayName("Admin approves store transitions approval status to APPROVED")
    void approveStore_success() {
        UUID adminUserId = UUID.randomUUID();
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> inv.getArgument(0));

        StoreApprovalActionResponse response = storeService.approveStore(storeId, adminUserId);

        assertThat(response.approvalStatus()).isEqualTo("APPROVED");
        assertThat(response.status()).isEqualTo("ACTIVE");
        assertThat(store.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(store.getApprovedAt()).isNotNull();
    }

    @Test
    @DisplayName("Admin approving already APPROVED store throws 409 Conflict")
    void approveStore_alreadyApproved_throwsConflict() {
        UUID adminUserId = UUID.randomUUID();
        store.setApprovalStatus(ApprovalStatus.APPROVED);
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));

        assertThatThrownBy(() -> storeService.approveStore(storeId, adminUserId))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Store cannot be approved in its current state");
    }

    @Test
    @DisplayName("Admin rejects store with reason")
    void rejectStore_success() {
        UUID adminUserId = UUID.randomUUID();
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> inv.getArgument(0));

        StoreApprovalActionResponse response = storeService.rejectStore(storeId, "Invalid store address", adminUserId);

        assertThat(response.approvalStatus()).isEqualTo("REJECTED");
        assertThat(response.reason()).isEqualTo("Invalid store address");
        assertThat(store.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED);
        assertThat(store.getRejectionReason()).isEqualTo("Invalid store address");
    }

    @Test
    @DisplayName("Admin suspends store with reason")
    void suspendStore_success() {
        UUID adminUserId = UUID.randomUUID();
        store.setApprovalStatus(ApprovalStatus.APPROVED);
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> inv.getArgument(0));

        StoreApprovalActionResponse response = storeService.suspendStore(storeId, "Regulatory compliance failure", adminUserId);

        assertThat(response.status()).isEqualTo("SUSPENDED");
        assertThat(response.reason()).isEqualTo("Regulatory compliance failure");
        assertThat(store.getStatus()).isEqualTo(StoreStatus.SUSPENDED);
        assertThat(store.getSuspensionReason()).isEqualTo("Regulatory compliance failure");
    }

    @Test
    @DisplayName("Legacy create store succeeds for merchant owner")
    void createStore_legacy_success() {
        CreateStoreRequest request = new CreateStoreRequest(
                merchantId, "Pune Store", "123 FC Road", "PUNE", "Maharashtra", "411004",
                new BigDecimal("18.5204"), new BigDecimal("73.8567")
        );

        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> {
            Store s = inv.getArgument(0);
            s.setId(storeId);
            return s;
        });

        StoreResponse response = storeService.createStore(request, ownerId, false);

        assertThat(response).isNotNull();
        assertThat(response.storeName()).isEqualTo("Pune Store");
        assertThat(response.merchantId()).isEqualTo(merchantId.toString());
    }

    @Test
    @DisplayName("Admin updates store approval status from PENDING to APPROVED")
    void updateApprovalStatus_admin_success() {
        UpdateApprovalStatusRequest request = new UpdateApprovalStatusRequest(ApprovalStatus.APPROVED, "Verified physical site");

        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> inv.getArgument(0));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));

        StoreResponse response = storeService.updateApprovalStatus(storeId, request);
        assertThat(response.approvalStatus()).isEqualTo("APPROVED");
    }

    @Test
    @DisplayName("Find nearby approved stores executes geospatial search and computes distances")
    void findNearbyStores_success() {
        store.setStatus(StoreStatus.ACTIVE);
        store.setApprovalStatus(ApprovalStatus.APPROVED);
        when(storeRepository.findNearbyApprovedStores(eq(18.52), eq(73.85), eq(5000.0), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(store)));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));

        Page<StoreResponse> page = storeService.findNearbyStores(18.52, 73.85, 5000.0, PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).distanceMeters()).isNotNull();
        assertThat(page.getContent().get(0).distanceMeters()).isLessThan(5000.0);
    }
}
