package com.superapp.wallet.service;

import com.superapp.wallet.dto.*;
import com.superapp.wallet.enums.PayoutStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface MerchantPayoutService {

    PayoutRequestResponse requestPayout(UUID merchantId, UUID userId, CreatePayoutRequest request);

    Page<PayoutRequestResponse> getMerchantPayouts(UUID merchantId, Pageable pageable);

    Page<PayoutRequestResponse> getAllPayoutsForAdmin(PayoutStatus status, Pageable pageable);

    PlatformSettlementOverviewResponse getPlatformSettlementOverview();

    void processPayoutWebhook(WebhookPayloadDto webhook, String rawPayload, String signatureHeader, String providerStr);

    PayoutRequestResponse adminHoldPayout(UUID payoutId, String reason, UUID adminUserId);

    PayoutRequestResponse adminReleasePayout(UUID payoutId, UUID adminUserId);

    PayoutRequestResponse adminRetryPayout(UUID payoutId, UUID adminUserId);
}
