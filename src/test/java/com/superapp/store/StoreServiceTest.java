package com.superapp.store;

import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.store.dto.CreateStoreRequest;
import com.superapp.store.dto.StoreResponse;
import com.superapp.store.dto.UpdateStoreRequest;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import com.superapp.store.service.StoreServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
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

    @InjectMocks private StoreServiceImpl storeService;

    private UUID merchantId;
    private UUID ownerId;
    private Merchant merchant;
    private UUID storeId;
    private Store store;

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
    }

    @Test
    @DisplayName("Create store succeeds for merchant owner and sets PENDING status")
    void createStore_success() {
        CreateStoreRequest request = new CreateStoreRequest(
                merchantId,
                "Pune Store",
                "123 FC Road",
                "PUNE",
                "Maharashtra",
                "411004",
                new BigDecimal("18.5204"),
                new BigDecimal("73.8567")
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
        assertThat(response.merchantId()).isEqualTo(merchantId);
        assertThat(response.merchantName()).isEqualTo("ABC Brands");
        assertThat(response.status()).isEqualTo(ApprovalStatus.PENDING);
        assertThat(response.latitude()).isEqualTo(new BigDecimal("18.5204"));
        assertThat(response.longitude()).isEqualTo(new BigDecimal("73.8567"));
    }

    @Test
    @DisplayName("Admin updates store approval status from PENDING to APPROVED")
    void updateApprovalStatus_admin_success() {
        UpdateApprovalStatusRequest request = new UpdateApprovalStatusRequest(ApprovalStatus.APPROVED, "Verified physical site");

        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(storeRepository.save(any(Store.class))).thenAnswer(inv -> inv.getArgument(0));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));

        StoreResponse response = storeService.updateApprovalStatus(storeId, request);
        assertThat(response.status()).isEqualTo(ApprovalStatus.APPROVED);
    }

    @Test
    @DisplayName("Find nearby approved stores executes geospatial search and computes distances")
    void findNearbyStores_success() {
        store.setStatus(ApprovalStatus.APPROVED);
        when(storeRepository.findNearbyApprovedStores(eq(18.52), eq(73.85), eq(5000.0), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(store)));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));

        Page<StoreResponse> page = storeService.findNearbyStores(18.52, 73.85, 5000.0, PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).distanceMeters()).isNotNull();
        assertThat(page.getContent().get(0).distanceMeters()).isLessThan(5000.0);
    }
}
