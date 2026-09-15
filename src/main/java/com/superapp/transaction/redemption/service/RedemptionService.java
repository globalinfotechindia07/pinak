package com.superapp.transaction.redemption.service;

import com.superapp.transaction.redemption.dto.CreateRedemptionRequest;
import com.superapp.transaction.redemption.dto.RedemptionHistoryResponse;
import com.superapp.transaction.redemption.dto.RedemptionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.UUID;

public interface RedemptionService {

    RedemptionResponse redeemOffer(UUID customerId, CreateRedemptionRequest request, String idempotencyKey, String requestId);

    RedemptionResponse getRedemptionById(UUID redemptionId, UUID currentUserId, boolean isAdmin);

    Page<RedemptionHistoryResponse> getCustomerRedemptions(
            UUID customerId, String status, Instant fromDate, Instant toDate, Pageable pageable);

    Page<RedemptionHistoryResponse> getMerchantRedemptions(
            UUID merchantOwnerUserId, UUID storeId, UUID offerId, String status, Instant fromDate, Instant toDate, Pageable pageable);

    Page<RedemptionHistoryResponse> getAdminRedemptions(
            UUID customerId, UUID merchantId, UUID storeId, UUID offerId, String status, Instant fromDate, Instant toDate, Pageable pageable);
}
