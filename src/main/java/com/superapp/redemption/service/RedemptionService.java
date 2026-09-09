package com.superapp.redemption.service;

import com.superapp.redemption.dto.CreateRedemptionRequest;
import com.superapp.redemption.dto.RedemptionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface RedemptionService {

    RedemptionResponse createRedemption(CreateRedemptionRequest request, UUID customerId);

    RedemptionResponse getRedemptionById(UUID id, UUID currentUserId, boolean isAdmin);

    Page<RedemptionResponse> getAllRedemptions(Pageable pageable);

    Page<RedemptionResponse> getCustomerRedemptions(UUID customerId, Pageable pageable);

    RedemptionResponse completeRedemption(UUID redemptionId, UUID paymentId);
}
