package com.superapp.merchant.service;

import com.superapp.merchant.dto.*;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.enums.MerchantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface MerchantService {

    // Registration & Profile
    MerchantResponse createMerchant(CreateMerchantRequest request, UUID currentUserId, boolean isAdmin);

    MerchantResponse createMerchant(CreateMerchantRequest request, UUID currentUserId);

    MerchantResponse getMerchantProfile(UUID currentUserId);

    MerchantResponse updateMerchantProfile(UpdateMerchantProfileRequest request, UUID currentUserId);

    // KYC
    MerchantKycResponse submitKyc(MerchantKycRequest request, UUID currentUserId);

    // Query & Admin
    MerchantResponse getMerchantById(UUID id);

    Page<MerchantResponse> getAllMerchants(Pageable pageable);

    Page<MerchantResponse> getAllMerchants(Pageable pageable, MerchantStatus status, ApprovalStatus approvalStatus);

    Page<MerchantResponse> getMerchantsByOwner(UUID ownerUserId, Pageable pageable);

    MerchantResponse updateMerchant(UUID id, UpdateMerchantRequest request, UUID currentUserId, boolean isAdmin);

    void deleteMerchant(UUID id, UUID currentUserId, boolean isAdmin);

    MerchantResponse updateApprovalStatus(UUID id, UpdateApprovalStatusRequest request);

    // Admin Workflow
    MerchantApprovalActionResponse approveMerchant(UUID merchantId, UUID adminUserId);

    MerchantApprovalActionResponse rejectMerchant(UUID merchantId, String reason, UUID adminUserId);

    MerchantApprovalActionResponse suspendMerchant(UUID merchantId, String reason, UUID adminUserId);

    MerchantApprovalActionResponse activateMerchant(UUID merchantId, String reason, UUID adminUserId);

    void resendMerchantWelcomeEmail(UUID merchantId, UUID adminUserId);
}
