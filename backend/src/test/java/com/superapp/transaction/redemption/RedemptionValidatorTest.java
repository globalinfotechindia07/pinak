package com.superapp.transaction.redemption;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.repository.StoreRepository;
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.enums.PaymentStatus;
import com.superapp.transaction.payment.repository.PaymentRepository;
import com.superapp.transaction.redemption.entity.Redemption;
import com.superapp.transaction.redemption.enums.RedemptionStatus;
import com.superapp.transaction.redemption.repository.RedemptionRepository;
import com.superapp.transaction.redemption.validation.RedemptionValidator;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedemptionValidatorTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private OfferRepository offerRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private MerchantRepository merchantRepository;
    @Mock private RedemptionRepository redemptionRepository;

    @InjectMocks
    private RedemptionValidator validator;

    private UUID customerId;
    private UUID paymentId;
    private UUID offerId;
    private UUID storeId;
    private UUID merchantId;
    private Payment payment;
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
        payment.setAmount(BigDecimal.valueOf(1000));
        payment.setGrossAmount(BigDecimal.valueOf(1000));

        offer = new Offer();
        offer.setId(offerId);
        offer.setMerchantId(merchantId);
        offer.setStoreId(storeId);
        offer.setStatus(OfferStatus.ACTIVE);
        offer.setApprovalStatus(OfferApprovalStatus.APPROVED);
        offer.setValidFrom(Instant.now().minus(1, ChronoUnit.DAYS));
        offer.setValidTo(Instant.now().plus(1, ChronoUnit.DAYS));
        offer.setUsageLimit(100);
        offer.setPerCustomerLimit(2);
        offer.setCurrentUsageCount(5);

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
    @DisplayName("Should pass validation when all constraints and states are valid")
    void testValidateRedemption_Success() {
        when(redemptionRepository.findByPaymentIdAndOfferId(paymentId, offerId)).thenReturn(Optional.empty());
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(offerRepository.findByIdForUpdate(offerId)).thenReturn(Optional.of(offer));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(redemptionRepository.countByCustomerIdAndOfferIdAndStatus(customerId, offerId, RedemptionStatus.SUCCESS)).thenReturn(0L);

        RedemptionValidator.ValidatedRedemption result = validator.validateRedemption(customerId, paymentId, offerId);
        assertNotNull(result);
        assertEquals(payment, result.payment());
        assertEquals(offer, result.offer());
        assertEquals(store, result.store());
        assertEquals(merchant, result.merchant());
    }

    @Test
    @DisplayName("Should reject if payment has already been redeemed successfully")
    void testValidateRedemption_AlreadyRedeemed() {
        Redemption existing = new Redemption();
        existing.setStatus(RedemptionStatus.SUCCESS);
        when(redemptionRepository.findByPaymentIdAndOfferId(paymentId, offerId)).thenReturn(Optional.of(existing));

        AppException ex = assertThrows(AppException.class, () -> validator.validateRedemption(customerId, paymentId, offerId));
        assertEquals(ApiError.OFFER_ALREADY_REDEEMED, ex.getErrorCode());
        assertEquals(409, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should reject if payment is not found")
    void testValidateRedemption_PaymentNotFound() {
        when(redemptionRepository.findByPaymentIdAndOfferId(paymentId, offerId)).thenReturn(Optional.empty());
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> validator.validateRedemption(customerId, paymentId, offerId));
        assertEquals(ApiError.PAYMENT_NOT_FOUND, ex.getErrorCode());
        assertEquals(404, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should reject if payment belongs to a different customer")
    void testValidateRedemption_WrongCustomer() {
        when(redemptionRepository.findByPaymentIdAndOfferId(paymentId, offerId)).thenReturn(Optional.empty());
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        UUID anotherCustomer = UUID.randomUUID();
        AppException ex = assertThrows(AppException.class, () -> validator.validateRedemption(anotherCustomer, paymentId, offerId));
        assertEquals(ApiError.PAYMENT_ACCESS_DENIED, ex.getErrorCode());
        assertEquals(403, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should reject if payment status is not SUCCESS (e.g. PENDING or FAILED)")
    void testValidateRedemption_PaymentNotSuccessful() {
        payment.setStatus(PaymentStatus.PENDING);
        when(redemptionRepository.findByPaymentIdAndOfferId(paymentId, offerId)).thenReturn(Optional.empty());
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        AppException ex = assertThrows(AppException.class, () -> validator.validateRedemption(customerId, paymentId, offerId));
        assertEquals(ApiError.PAYMENT_NOT_SUCCESSFUL, ex.getErrorCode());
        assertEquals(409, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should reject if payment offer does not match request offer")
    void testValidateRedemption_OfferMismatch() {
        payment.setOfferId(UUID.randomUUID());
        when(redemptionRepository.findByPaymentIdAndOfferId(paymentId, offerId)).thenReturn(Optional.empty());
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        AppException ex = assertThrows(AppException.class, () -> validator.validateRedemption(customerId, paymentId, offerId));
        assertEquals(ApiError.OFFER_NOT_ELIGIBLE, ex.getErrorCode());
        assertEquals(400, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should reject if offer has expired")
    void testValidateRedemption_OfferExpired() {
        offer.setValidTo(Instant.now().minus(1, ChronoUnit.HOURS));
        when(redemptionRepository.findByPaymentIdAndOfferId(paymentId, offerId)).thenReturn(Optional.empty());
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(offerRepository.findByIdForUpdate(offerId)).thenReturn(Optional.of(offer));

        AppException ex = assertThrows(AppException.class, () -> validator.validateRedemption(customerId, paymentId, offerId));
        assertEquals(ApiError.OFFER_EXPIRED, ex.getErrorCode());
        assertEquals(409, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should reject if customer per-offer usage limit has been reached")
    void testValidateRedemption_CustomerLimitReached() {
        when(redemptionRepository.findByPaymentIdAndOfferId(paymentId, offerId)).thenReturn(Optional.empty());
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(offerRepository.findByIdForUpdate(offerId)).thenReturn(Optional.of(offer));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(redemptionRepository.countByCustomerIdAndOfferIdAndStatus(customerId, offerId, RedemptionStatus.SUCCESS)).thenReturn(2L);

        AppException ex = assertThrows(AppException.class, () -> validator.validateRedemption(customerId, paymentId, offerId));
        assertEquals(ApiError.CUSTOMER_OFFER_LIMIT_REACHED, ex.getErrorCode());
        assertEquals(409, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should reject if global offer usage limit has been reached")
    void testValidateRedemption_GlobalLimitReached() {
        offer.setUsageLimit(10);
        offer.setCurrentUsageCount(10);
        when(redemptionRepository.findByPaymentIdAndOfferId(paymentId, offerId)).thenReturn(Optional.empty());
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(offerRepository.findByIdForUpdate(offerId)).thenReturn(Optional.of(offer));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(redemptionRepository.countByCustomerIdAndOfferIdAndStatus(customerId, offerId, RedemptionStatus.SUCCESS)).thenReturn(0L);

        AppException ex = assertThrows(AppException.class, () -> validator.validateRedemption(customerId, paymentId, offerId));
        assertEquals(ApiError.OFFER_USAGE_LIMIT_REACHED, ex.getErrorCode());
        assertEquals(409, ex.getHttpStatus());
    }
}
