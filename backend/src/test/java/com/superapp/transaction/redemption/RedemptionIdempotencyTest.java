package com.superapp.transaction.redemption;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.Merchant;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.entity.Store;
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.enums.PaymentStatus;
import com.superapp.transaction.redemption.dto.CreateRedemptionRequest;
import com.superapp.transaction.redemption.dto.RedemptionResponse;
import com.superapp.transaction.redemption.entity.Redemption;
import com.superapp.transaction.redemption.enums.RedemptionStatus;
import com.superapp.transaction.redemption.mapper.RedemptionMapper;
import com.superapp.transaction.redemption.repository.RedemptionRepository;
import com.superapp.transaction.redemption.service.RedemptionServiceImpl;
import com.superapp.transaction.redemption.validation.RedemptionValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedemptionIdempotencyTest {

    @Mock private RedemptionRepository redemptionRepository;
    @Mock private RedemptionValidator redemptionValidator;
    @Spy private RedemptionMapper redemptionMapper = new RedemptionMapper();
    @Mock private OfferRepository offerRepository;
    @Mock private com.superapp.common.audit.AuditService auditService;

    @InjectMocks
    private RedemptionServiceImpl redemptionService;

    private UUID customerId;
    private UUID paymentId;
    private UUID offerId;
    private String idempotencyKey;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        paymentId = UUID.randomUUID();
        offerId = UUID.randomUUID();
        idempotencyKey = "idemp-key-test-123";
    }

    @Test
    @DisplayName("Should return existing redemption if request has same key and same payload")
    void testIdempotency_ReplaySamePayload() {
        CreateRedemptionRequest request = new CreateRedemptionRequest(paymentId, offerId);

        Redemption existing = new Redemption();
        existing.setId(UUID.randomUUID());
        existing.setCustomerId(customerId);
        existing.setPaymentId(paymentId);
        existing.setOfferId(offerId);
        existing.setStoreId(UUID.randomUUID());
        existing.setStatus(RedemptionStatus.SUCCESS);
        existing.setRedeemedAmount(BigDecimal.valueOf(500));

        when(redemptionRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey))
                .thenReturn(Optional.of(existing));

        RedemptionResponse response = redemptionService.redeemOffer(customerId, request, idempotencyKey, "req-1");

        assertNotNull(response);
        assertEquals(existing.getId(), response.redemptionId());
        verifyNoInteractions(redemptionValidator);
        verify(redemptionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject with 409 IDEMPOTENCY_CONFLICT if same key is used with different payload")
    void testIdempotency_ConflictDifferentPayload() {
        CreateRedemptionRequest request = new CreateRedemptionRequest(paymentId, offerId);

        Redemption existing = new Redemption();
        existing.setId(UUID.randomUUID());
        existing.setCustomerId(customerId);
        existing.setPaymentId(paymentId);
        existing.setOfferId(UUID.randomUUID()); // Different offer!

        when(redemptionRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey))
                .thenReturn(Optional.of(existing));

        AppException ex = assertThrows(AppException.class,
                () -> redemptionService.redeemOffer(customerId, request, idempotencyKey, "req-2"));

        assertEquals(ApiError.IDEMPOTENCY_CONFLICT, ex.getErrorCode());
        assertEquals(409, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should fail with 400 when Idempotency-Key is missing or blank")
    void testIdempotency_MissingKey() {
        CreateRedemptionRequest request = new CreateRedemptionRequest(paymentId, offerId);

        AppException ex = assertThrows(AppException.class,
                () -> redemptionService.redeemOffer(customerId, request, "", "req-3"));
        assertEquals(ApiError.VALIDATION_FAILED, ex.getErrorCode());
        assertEquals(400, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should catch DataIntegrityViolationException and identify duplicate payment/offer attempt")
    void testDatabaseConstraint_DuplicatePaymentOffer() {
        CreateRedemptionRequest request = new CreateRedemptionRequest(paymentId, offerId);

        Payment payment = new Payment();
        payment.setId(paymentId);
        payment.setCustomerId(customerId);
        payment.setGrossAmount(BigDecimal.valueOf(500));
        payment.setStatus(PaymentStatus.SUCCESS);

        Offer offer = new Offer();
        offer.setId(offerId);
        offer.setValue(BigDecimal.valueOf(10));
        offer.setCurrentUsageCount(0);

        Store store = new Store();
        store.setId(UUID.randomUUID());
        Merchant merchant = new Merchant();
        merchant.setId(UUID.randomUUID());

        when(redemptionRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey))
                .thenReturn(Optional.empty());
        when(redemptionValidator.validateRedemption(customerId, paymentId, offerId))
                .thenReturn(new RedemptionValidator.ValidatedRedemption(payment, null, offer, store, merchant));
        when(redemptionRepository.save(any(Redemption.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint"));

        Redemption duplicate = new Redemption();
        duplicate.setId(UUID.randomUUID());
        when(redemptionRepository.findByCustomerIdAndPaymentIdAndOfferId(customerId, paymentId, offerId))
                .thenReturn(Optional.of(duplicate));

        AppException ex = assertThrows(AppException.class,
                () -> redemptionService.redeemOffer(customerId, request, idempotencyKey, "req-4"));

        assertEquals(ApiError.OFFER_ALREADY_REDEEMED, ex.getErrorCode());
        assertEquals(409, ex.getHttpStatus());
    }
}
