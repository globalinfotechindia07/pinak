package com.superapp.merchant;

import com.superapp.category.repository.CategoryRepository;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.merchant.dto.CreateMerchantRequest;
import com.superapp.merchant.dto.MerchantResponse;
import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.merchant.dto.UpdateMerchantRequest;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.KycStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.merchant.service.MerchantServiceImpl;
import com.superapp.user.repository.UserRepository;
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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MerchantServiceTest {

    @Mock private MerchantRepository merchantRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private MerchantServiceImpl merchantService;

    private UUID merchantId;
    private UUID ownerId;
    private Merchant merchant;

    @BeforeEach
    void setUp() {
        merchantId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
        merchant = new Merchant(ownerId, "Acme Fitness", null);
        merchant.setId(merchantId);
    }

    @Test
    @DisplayName("Create merchant succeeds and defaults to PENDING approval status")
    void createMerchant_success() {
        CreateMerchantRequest request = new CreateMerchantRequest("Acme Fitness", null, null);

        when(userRepository.existsById(ownerId)).thenReturn(true);
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(inv -> {
            Merchant m = inv.getArgument(0);
            m.setId(merchantId);
            return m;
        });

        MerchantResponse response = merchantService.createMerchant(request, ownerId, false);

        assertThat(response).isNotNull();
        assertThat(response.businessName()).isEqualTo("Acme Fitness");
        assertThat(response.status()).isEqualTo(ApprovalStatus.PENDING);
        assertThat(response.kycStatus()).isEqualTo(KycStatus.PENDING);
        verify(merchantRepository).save(any(Merchant.class));
    }

    @Test
    @DisplayName("Update merchant by non-owner without admin privileges throws 403 Forbidden")
    void updateMerchant_unauthorized_throwsForbidden() {
        UUID otherUser = UUID.randomUUID();
        UpdateMerchantRequest request = new UpdateMerchantRequest("Hacked Fitness", null);

        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));

        assertThatThrownBy(() -> merchantService.updateMerchant(merchantId, request, otherUser, false))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("not have permission");
    }

    @Test
    @DisplayName("Update merchant by owner succeeds")
    void updateMerchant_owner_success() {
        UpdateMerchantRequest request = new UpdateMerchantRequest("Acme Fitness Center", null);

        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(inv -> inv.getArgument(0));

        MerchantResponse response = merchantService.updateMerchant(merchantId, request, ownerId, false);
        assertThat(response.businessName()).isEqualTo("Acme Fitness Center");
    }

    @Test
    @DisplayName("Admin updates approval status from PENDING to APPROVED")
    void updateApprovalStatus_admin_success() {
        UpdateApprovalStatusRequest request = new UpdateApprovalStatusRequest(ApprovalStatus.APPROVED, "KYC verified");

        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(inv -> inv.getArgument(0));

        MerchantResponse response = merchantService.updateApprovalStatus(merchantId, request);
        assertThat(response.status()).isEqualTo(ApprovalStatus.APPROVED);
    }

    @Test
    @DisplayName("Get all merchants paginated succeeds")
    void getAllMerchants_success() {
        when(merchantRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(List.of(merchant)));

        Page<MerchantResponse> page = merchantService.getAllMerchants(PageRequest.of(0, 10));
        assertThat(page.getTotalElements()).isEqualTo(1);
    }
}
