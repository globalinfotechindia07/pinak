package com.superapp.transaction.redemption;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferType;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.transaction.reward.service.RewardService;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
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
import com.superapp.transaction.transaction.entity.Transaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedemptionServiceTest {

    @Mock private RedemptionRepository redemptionRepository;
    @Mock private RedemptionValidator redemptionValidator;
    @Spy private RedemptionMapper redemptionMapper = new RedemptionMapper();
    @Mock private OfferRepository offerRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private MerchantRepository merchantRepository;
    @Mock private AuditService auditService;
    @Mock private RewardService rewardService;

    @InjectMocks
    private RedemptionServiceImpl redemptionService;

    private UUID customerId;
    private UUID paymentId;
    private UUID offerId;
    private UUID storeId;
    private UUID merchantId;
    private Payment payment;
    private Transaction transaction;
    private Offer offer;
    private Store store;
    private Merchant merchant;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        paymentId = UUID.randomUUID();
        offerId = UUID.randomUUID();
        storeId = UUID.randomUUID();
        merchantId = UUID.randomUUID();

        payment = new Payment();
        payment.setId(paymentId);
        payment.setCustomerId(customerId);
        payment.setMerchantId(merchantId);
        payment.setStoreId(storeId);
        payment.setOfferId(offerId);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setGrossAmount(BigDecimal.valueOf(1000));
        payment.setDiscountAmount(BigDecimal.valueOf(100));
        payment.setPayableAmount(BigDecimal.valueOf(900));

        transaction = new Transaction();
        transaction.setId(UUID.randomUUID());
        transaction.setPaymentId(paymentId);
        payment.setTransactionId(transaction.getId());

        offer = new Offer();
        offer.setId(offerId);
        offer.setMerchantId(merchantId);
        offer.setStoreId(storeId);
        offer.setType(OfferType.FIXED_DISCOUNT);
        offer.setValue(BigDecimal.valueOf(100));
        offer.setCurrentUsageCount(0);

        store = new Store();
        store.setId(storeId);
        store.setMerchantId(merchantId);
        store.setStoreName("Nagpur Store");

        merchant = new Merchant();
        merchant.setId(merchantId);
        merchant.setOwnerUserId(UUID.randomUUID());
    }

    @Test
    @DisplayName("Should successfully redeem offer and update usage count")
    void testRedeemOffer_Success() {
        String idempotencyKey = "key-123";
        String requestId = "req-123";
        CreateRedemptionRequest request = new CreateRedemptionRequest(paymentId, offerId);

        when(redemptionRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey))
                .thenReturn(Optional.empty());
        when(redemptionValidator.validateRedemption(customerId, paymentId, offerId))
                .thenReturn(new RedemptionValidator.ValidatedRedemption(payment, transaction, offer, store, merchant));
        when(redemptionRepository.save(any(Redemption.class))).thenAnswer(inv -> {
            Redemption r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        RedemptionResponse response = redemptionService.redeemOffer(customerId, request, idempotencyKey, requestId);

        assertNotNull(response);
        assertEquals(paymentId, response.paymentId());
        assertEquals(offerId, response.offerId());
        assertEquals(RedemptionStatus.SUCCESS, response.status());
        assertEquals(1, offer.getCurrentUsageCount());

        verify(offerRepository).save(offer);
        verify(auditService).record(eq(AuditEventType.REDEMPTION_SUCCESS), eq(customerId), isNull(), isNull(), eq(requestId), any());
    }

    @Test
    @DisplayName("Should calculate rewardAmount when offer is CASHBACK")
    void testRedeemOffer_Cashback() {
        offer.setType(OfferType.CASHBACK);
        offer.setValue(BigDecimal.valueOf(10)); // 10% cashback
        offer.setMaxDiscountAmount(BigDecimal.valueOf(50)); // cap at 50

        String idempotencyKey = "key-cashback";
        CreateRedemptionRequest request = new CreateRedemptionRequest(paymentId, offerId);

        when(redemptionRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey))
                .thenReturn(Optional.empty());
        when(redemptionValidator.validateRedemption(customerId, paymentId, offerId))
                .thenReturn(new RedemptionValidator.ValidatedRedemption(payment, transaction, offer, store, merchant));
        when(redemptionRepository.save(any(Redemption.class))).thenAnswer(inv -> {
            Redemption r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        RedemptionResponse response = redemptionService.redeemOffer(customerId, request, idempotencyKey, "req-cb");

        assertNotNull(response);
        // payment had discountAmount=100, which is preserved as rewardAmount
        assertEquals(BigDecimal.valueOf(100), response.rewardAmount());
        assertEquals(BigDecimal.ZERO.setScale(2), response.discountAmount());
        verify(rewardService).creditRedemptionReward(eq(customerId), any(), any(), eq(BigDecimal.valueOf(100)), any());
    }

    @Test
    @DisplayName("Should prevent non-admin from viewing another customer's redemption")
    void testGetRedemptionById_AccessDenied() {
        UUID redemptionId = UUID.randomUUID();
        Redemption redemption = new Redemption();
        redemption.setId(redemptionId);
        redemption.setCustomerId(UUID.randomUUID()); // Different customer

        when(redemptionRepository.findById(redemptionId)).thenReturn(Optional.of(redemption));

        AppException ex = assertThrows(AppException.class,
                () -> redemptionService.getRedemptionById(redemptionId, customerId, false));
        assertEquals(403, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should allow admin to view any customer's redemption")
    void testGetRedemptionById_AdminAllowed() {
        UUID redemptionId = UUID.randomUUID();
        Redemption redemption = new Redemption();
        redemption.setId(redemptionId);
        redemption.setCustomerId(UUID.randomUUID()); // Different customer
        redemption.setStatus(RedemptionStatus.SUCCESS);

        when(redemptionRepository.findById(redemptionId)).thenReturn(Optional.of(redemption));

        RedemptionResponse response = redemptionService.getRedemptionById(redemptionId, customerId, true);
        assertNotNull(response);
        assertEquals(redemptionId, response.redemptionId());
    }
}
