package com.superapp.merchant;

import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.merchant.dto.*;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.KycStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.entity.MerchantKyc;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.mapper.MerchantMapper;
import com.superapp.merchant.repository.MerchantKycRepository;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.merchant.service.MerchantServiceImpl;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.repository.UserRepository;
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
    @Mock private MerchantKycRepository merchantKycRepository;
    @Mock private AuditService auditService;
    @Spy private MerchantMapper merchantMapper = new MerchantMapper();

    @InjectMocks private MerchantServiceImpl merchantService;

    private UUID merchantId;
    private UUID ownerId;
    private UUID categoryId;
    private Merchant merchant;

    @BeforeEach
    void setUp() {
        merchantId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
        categoryId = UUID.randomUUID();
        merchant = new Merchant(ownerId, "Acme Fitness", categoryId);
        merchant.setId(merchantId);
        merchant.setStatus(MerchantStatus.ACTIVE);
        merchant.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        merchant.setKycStatus(KycStatus.PENDING);
    }

    @Test
    @DisplayName("Create merchant succeeds and defaults to ACTIVE status and PENDING_APPROVAL")
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
        assertThat(response.status()).isEqualTo("ACTIVE");
        assertThat(response.approvalStatus()).isEqualTo("PENDING_APPROVAL");
        assertThat(response.kycStatus()).isEqualTo("PENDING");
        verify(merchantRepository).save(any(Merchant.class));
    }

    @Test
    @DisplayName("Create merchant fails if category is INACTIVE")
    void createMerchant_inactiveCategory_throwsException() {
        CreateMerchantRequest request = new CreateMerchantRequest(
                "Acme Fitness", "Acme Fitness LLC", "Desc", categoryId, "9876543210", "acme@test.com", "https://acme.com"
        );

        Category inactiveCategory = new Category();
        inactiveCategory.setStatus(CategoryStatus.INACTIVE);

        when(userRepository.existsById(ownerId)).thenReturn(true);
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(inactiveCategory));

        assertThatThrownBy(() -> merchantService.createMerchant(request, ownerId, false))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Category is not active");
    }

    @Test
    @DisplayName("Create merchant fails if email already belongs to an existing merchant")
    void createMerchant_duplicateMerchantEmail_throwsException() {
        CreateMerchantRequest request = new CreateMerchantRequest(
                "Acme Fitness", "Acme Fitness LLC", "Desc", categoryId, "9876543210", "duplicate@test.com", "https://acme.com"
        );

        when(merchantRepository.existsByEmailIgnoreCase("duplicate@test.com")).thenReturn(true);

        assertThatThrownBy(() -> merchantService.createMerchant(request, ownerId, false))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("A merchant is already registered with email");
    }

    @Test
    @DisplayName("Create merchant fails if email belongs to an internal platform administrator (Role Conflict)")
    void createMerchant_adminEmailRoleConflict_throwsException() {
        CreateMerchantRequest request = new CreateMerchantRequest(
                "Acme Fitness", "Acme Fitness LLC", "Desc", categoryId, "9876543210", "admin@superapp.com", "https://acme.com"
        );

        User adminUser = new User();
        adminUser.setEmail("admin@superapp.com");
        adminUser.setRole(Role.ADMIN);

        when(merchantRepository.existsByEmailIgnoreCase("admin@superapp.com")).thenReturn(false);
        when(userRepository.findByEmail("admin@superapp.com")).thenReturn(Optional.of(adminUser));

        assertThatThrownBy(() -> merchantService.createMerchant(request, ownerId, true))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Role Conflict")
                .hasMessageContaining("belongs to an internal platform administrator");
    }

    @Test
    @DisplayName("Get merchant profile by authenticated owner succeeds")
    void getMerchantProfile_owner_success() {
        when(merchantRepository.findByOwnerUserId(ownerId)).thenReturn(Optional.of(merchant));

        MerchantResponse response = merchantService.getMerchantProfile(ownerId);

        assertThat(response).isNotNull();
        assertThat(response.businessName()).isEqualTo("Acme Fitness");
        assertThat(response.ownerUserId()).isEqualTo(ownerId.toString());
    }

    @Test
    @DisplayName("Get merchant profile throws AppException when merchant not found for owner")
    void getMerchantProfile_notFound_throwsException() {
        when(merchantRepository.findByOwnerUserId(ownerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> merchantService.getMerchantProfile(ownerId))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Merchant not found");
    }

    @Test
    @DisplayName("Update merchant profile by owner updates business fields safely")
    void updateMerchantProfile_owner_success() {
        UpdateMerchantProfileRequest request = new UpdateMerchantProfileRequest(
                "Acme Global Fitness", "Acme Worldwide LLC", "Updated Desc", null, "9123456789", "owner@acme.com", "https://acmeglobal.com"
        );

        when(merchantRepository.findByOwnerUserId(ownerId)).thenReturn(Optional.of(merchant));
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(inv -> inv.getArgument(0));

        MerchantResponse response = merchantService.updateMerchantProfile(request, ownerId);

        assertThat(response.businessName()).isEqualTo("Acme Global Fitness");
        assertThat(response.legalName()).isEqualTo("Acme Worldwide LLC");
        assertThat(response.phone()).isEqualTo("9123456789");
    }

    @Test
    @DisplayName("Submit KYC documents saves KYC entity and updates merchant state")
    void submitKyc_success() {
        MerchantKycRequest request = new MerchantKycRequest("PAN_CARD", "ABCDE1234F", "REG123", "TAX123", "https://docs.superapp.com/pan.pdf");

        when(merchantRepository.findByOwnerUserId(ownerId)).thenReturn(Optional.of(merchant));
        when(merchantKycRepository.save(any(MerchantKyc.class))).thenAnswer(inv -> {
            MerchantKyc k = inv.getArgument(0);
            k.setId(UUID.randomUUID());
            return k;
        });

        MerchantKycResponse response = merchantService.submitKyc(request, ownerId);

        assertThat(response).isNotNull();
        assertThat(response.documentType()).isEqualTo("PAN_CARD");
        assertThat(response.status()).isEqualTo("SUBMITTED");
        assertThat(merchant.getKycStatus()).isEqualTo(KycStatus.PENDING);
    }

    @Test
    @DisplayName("Admin approves merchant in PENDING_APPROVAL status succeeds")
    void approveMerchant_success() {
        UUID adminUserId = UUID.randomUUID();
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(inv -> inv.getArgument(0));

        MerchantApprovalActionResponse response = merchantService.approveMerchant(merchantId, adminUserId);

        assertThat(response.approvalStatus()).isEqualTo("APPROVED");
        assertThat(merchant.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(merchant.getApprovedAt()).isNotNull();
    }

    @Test
    @DisplayName("Admin approving already APPROVED merchant throws 409 Conflict")
    void approveMerchant_alreadyApproved_throwsConflict() {
        UUID adminUserId = UUID.randomUUID();
        merchant.setApprovalStatus(ApprovalStatus.APPROVED);
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));

        assertThatThrownBy(() -> merchantService.approveMerchant(merchantId, adminUserId))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Merchant cannot be approved in its current state");
    }

    @Test
    @DisplayName("Admin rejects merchant with reason")
    void rejectMerchant_success() {
        UUID adminUserId = UUID.randomUUID();
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(inv -> inv.getArgument(0));

        MerchantApprovalActionResponse response = merchantService.rejectMerchant(merchantId, "Incomplete documentation", adminUserId);

        assertThat(response.approvalStatus()).isEqualTo("REJECTED");
        assertThat(response.reason()).isEqualTo("Incomplete documentation");
        assertThat(merchant.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED);
        assertThat(merchant.getRejectionReason()).isEqualTo("Incomplete documentation");
    }

    @Test
    @DisplayName("Admin suspends merchant with reason")
    void suspendMerchant_success() {
        UUID adminUserId = UUID.randomUUID();
        merchant.setApprovalStatus(ApprovalStatus.APPROVED);
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(inv -> inv.getArgument(0));

        MerchantApprovalActionResponse response = merchantService.suspendMerchant(merchantId, "Policy violation", adminUserId);

        assertThat(response.status()).isEqualTo("SUSPENDED");
        assertThat(response.reason()).isEqualTo("Policy violation");
        assertThat(merchant.getStatus()).isEqualTo(MerchantStatus.SUSPENDED);
        assertThat(merchant.getSuspensionReason()).isEqualTo("Policy violation");
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
    @DisplayName("Legacy admin updates approval status from PENDING to APPROVED")
    void updateApprovalStatus_admin_success() {
        UpdateApprovalStatusRequest request = new UpdateApprovalStatusRequest(ApprovalStatus.APPROVED, "KYC verified");

        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(inv -> inv.getArgument(0));

        MerchantResponse response = merchantService.updateApprovalStatus(merchantId, request);
        assertThat(response.approvalStatus()).isEqualTo("APPROVED");
    }

    @Test
    @DisplayName("Get all merchants paginated succeeds")
    void getAllMerchants_success() {
        when(merchantRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(List.of(merchant)));

        Page<MerchantResponse> page = merchantService.getAllMerchants(PageRequest.of(0, 10));
        assertThat(page.getTotalElements()).isEqualTo(1);
    }
}
