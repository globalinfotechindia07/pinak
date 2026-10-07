package com.superapp.transaction.redemption;

import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.enums.OfferType;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.repository.StoreRepository;
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.enums.PaymentStatus;
import com.superapp.transaction.payment.repository.PaymentRepository;
import com.superapp.transaction.redemption.dto.CreateRedemptionRequest;
import com.superapp.transaction.redemption.dto.RedemptionResponse;
import com.superapp.transaction.redemption.entity.Redemption;
import com.superapp.transaction.redemption.enums.RedemptionStatus;
import com.superapp.transaction.redemption.mapper.RedemptionMapper;
import com.superapp.transaction.redemption.repository.RedemptionRepository;
import com.superapp.transaction.redemption.service.RedemptionServiceImpl;
import com.superapp.transaction.redemption.validation.RedemptionValidator;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RedemptionConcurrencyTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private OfferRepository offerRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private MerchantRepository merchantRepository;
    @Mock private RedemptionRepository redemptionRepository;
    @Mock private AuditService auditService;

    private RedemptionValidator redemptionValidator;
    private RedemptionServiceImpl redemptionService;
    private Offer offer;
    private Store store;
    private Merchant merchant;

    @BeforeEach
    void setUp() {
        redemptionValidator = new RedemptionValidator(
                paymentRepository, transactionRepository, offerRepository,
                storeRepository, merchantRepository, redemptionRepository
        );
        redemptionService = new RedemptionServiceImpl(
                redemptionRepository, redemptionValidator, new RedemptionMapper(),
                offerRepository, storeRepository, merchantRepository,
                auditService, null
        );

        UUID offerId = UUID.randomUUID();
        UUID merchantId = UUID.randomUUID();
        UUID storeId = UUID.randomUUID();

        offer = new Offer();
        offer.setId(offerId);
        offer.setMerchantId(merchantId);
        offer.setStoreId(storeId);
        offer.setTitle("Limited Flash Sale");
        offer.setType(OfferType.FIXED_DISCOUNT);
        offer.setValue(BigDecimal.valueOf(50));
        offer.setStatus(OfferStatus.ACTIVE);
        offer.setApprovalStatus(OfferApprovalStatus.APPROVED);
        offer.setValidFrom(Instant.now().minus(1, ChronoUnit.DAYS));
        offer.setValidTo(Instant.now().plus(1, ChronoUnit.DAYS));
        offer.setUsageLimit(3); // Only 3 redemptions allowed!
        offer.setCurrentUsageCount(0);

        store = new Store();
        store.setId(storeId);
        store.setMerchantId(merchantId);
        store.setStatus(StoreStatus.ACTIVE);
        store.setApprovalStatus(ApprovalStatus.APPROVED);

        merchant = new Merchant();
        merchant.setId(merchantId);
        merchant.setStatus(MerchantStatus.ACTIVE);
        merchant.setApprovalStatus(ApprovalStatus.APPROVED);
    }

    @Test
    @DisplayName("Simulate 10 concurrent redemption requests on an offer with limit=3: exactly 3 must succeed")
    void testConcurrentRedemptions_UsageLimitProtection() throws Exception {
        int threadCount = 10;
        int usageLimit = 3;

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger limitReachedCount = new AtomicInteger(0);

        // Synchronize on offer object to emulate pessimistic lock behavior
        when(offerRepository.findByIdForUpdate(offer.getId())).thenAnswer(inv -> {
            synchronized (offer) {
                return Optional.of(offer);
            }
        });
        when(storeRepository.findById(any())).thenReturn(Optional.of(store));
        when(merchantRepository.findById(any())).thenReturn(Optional.of(merchant));
        when(redemptionRepository.findByPaymentIdAndOfferId(any(), any())).thenReturn(Optional.empty());
        when(redemptionRepository.findByCustomerIdAndIdempotencyKey(any(), any())).thenReturn(Optional.empty());
        when(redemptionRepository.countByCustomerIdAndOfferIdAndStatus(any(), any(), any())).thenReturn(0L);

        when(redemptionRepository.save(any(Redemption.class))).thenAnswer(inv -> {
            Redemption r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        for (int i = 0; i < threadCount; i++) {
            UUID customerId = UUID.randomUUID();
            UUID paymentId = UUID.randomUUID();
            String idempotencyKey = "key-" + i;

            Payment payment = new Payment();
            payment.setId(paymentId);
            payment.setCustomerId(customerId);
            payment.setOfferId(offer.getId());
            payment.setStoreId(store.getId());
            payment.setMerchantId(merchant.getId());
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setGrossAmount(BigDecimal.valueOf(500));
            payment.setDiscountAmount(BigDecimal.valueOf(50));
            payment.setPayableAmount(BigDecimal.valueOf(450));

            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

            executor.submit(() -> {
                try {
                    startLatch.await();
                    synchronized (offer) {
                        RedemptionResponse response = redemptionService.redeemOffer(
                                customerId,
                                new CreateRedemptionRequest(paymentId, offer.getId()),
                                idempotencyKey,
                                "req-" + idempotencyKey
                        );
                        if (response != null && response.status() == RedemptionStatus.SUCCESS) {
                            successCount.incrementAndGet();
                        }
                    }
                } catch (AppException e) {
                    if (e.getErrorCode() == ApiError.OFFER_USAGE_LIMIT_REACHED) {
                        limitReachedCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        finishLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertEquals(usageLimit, successCount.get(), "Exactly 3 requests should succeed");
        assertEquals(threadCount - usageLimit, limitReachedCount.get(), "Remaining 7 requests should fail with limit reached");
        assertEquals(usageLimit, offer.getCurrentUsageCount(), "Offer usage count should equal the limit");
    }
}
