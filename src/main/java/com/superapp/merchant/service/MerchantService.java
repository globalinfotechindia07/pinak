package com.superapp.merchant.service;

import com.superapp.merchant.dto.CreateMerchantRequest;
import com.superapp.merchant.dto.MerchantResponse;
import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.merchant.dto.UpdateMerchantRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface MerchantService {

    MerchantResponse createMerchant(CreateMerchantRequest request, UUID currentUserId, boolean isAdmin);

    MerchantResponse getMerchantById(UUID id);

    Page<MerchantResponse> getAllMerchants(Pageable pageable);

    Page<MerchantResponse> getMerchantsByOwner(UUID ownerUserId, Pageable pageable);

    MerchantResponse updateMerchant(UUID id, UpdateMerchantRequest request, UUID currentUserId, boolean isAdmin);

    void deleteMerchant(UUID id, UUID currentUserId, boolean isAdmin);

    MerchantResponse updateApprovalStatus(UUID id, UpdateApprovalStatusRequest request);
}
