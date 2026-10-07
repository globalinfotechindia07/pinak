package com.superapp.transaction.payment.service;

import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.enums.OfferType;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.StoreStatus;
import com.superapp.transaction.payment.dto.CreatePaymentRequest;
import com.superapp.transaction.payment.dto.PaymentResponse;
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.enums.PaymentStatus;
import com.superapp.transaction.payment.mapper.PaymentMapper;
import com.superapp.transaction.payment.provider.PaymentProvider;
import com.superapp.transaction.payment.repository.PaymentRepository;
import com.superapp.transaction.payment.validation.PaymentValidator;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
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
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentIdempotencyTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private PaymentValidator paymentValidator;
    @Spy private PaymentMapper paymentMapper = new PaymentMapper();
    @Mock private PaymentProvider paymentProvider;
    @Mock private AuditService auditService;

    @InjectMocks private PaymentServiceImpl paymentService;

    private UUID customerId;
    private UUID merchantId;
    private UUID storeId;
    private UUID offerId;
    private User customer;
    private Merchant merchant;
    private Store store;
    private Offer offer;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        merchantId = UUID.randomUUID();
        storeId = UUID.randomUUID();
        offerId = UUID.randomUUID();

        customer = new User();
        customer.setId(customerId);
        customer.setRole(Role.CUSTOMER);
        customer.setStatus(UserStatus.ACTIVE);

        merchant = new Merchant();
        merchant.setId(merchantId);
        merchant.setStatus(MerchantStatus.ACTIVE);
        merchant.setApprovalStatus(ApprovalStatus.APPROVED);

        store = new Store();
        store.setId(storeId);
        store.setMerchantId(merchantId);
        store.setStatus(StoreStatus.ACTIVE);
        store.setApprovalStatus(ApprovalStatus.APPROVED);

        offer = new Offer();
        offer.setId(offerId);
        offer.setMerchantId(merchantId);
        offer.setStoreId(storeId);
        offer.setStatus(OfferStatus.ACTIVE);
        offer.setApprovalStatus(OfferApprovalStatus.APPROVED);
        offer.setType(OfferType.PERCENTAGE_DISCOUNT);
        offer.setValue(new BigDecimal("10.00"));
        offer.setValidFrom(Instant.now().minus(1, ChronoUnit.DAYS));
        offer.setValidTo(Instant.now().plus(1, ChronoUnit.DAYS));
    }

    @Test
    @DisplayName("Same request with same idempotency key returns existing payment without creating second payment")
    void testSameRequestSameKeyReturnsExistingPayment() {
        String idempotencyKey = "7b8f2f90-1234-4567";
        var request = new CreatePaymentRequest(offerId, storeId, new BigDecimal("5000.00"), "INR");

        Payment existingPayment = new Payment();
        existingPayment.setId(UUID.randomUUID());
        existingPayment.setCustomerId(customerId);
        existingPayment.setStoreId(storeId);
        existingPayment.setOfferId(offerId);
        existingPayment.setGrossAmount(new BigDecimal("5000.00"));
        existingPayment.setDiscountAmount(new BigDecimal("500.00"));
        existingPayment.setPayableAmount(new BigDecimal("4500.00"));
        existingPayment.setCurrency("INR");
        existingPayment.setStatus(PaymentStatus.PENDING);
        existingPayment.setIdempotencyKey(idempotencyKey);

        when(paymentRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey))
                .thenReturn(Optional.of(existingPayment));

        PaymentResponse response = paymentService.initiatePayment(request, customerId, idempotencyKey, "req_1");

        assertThat(response).isNotNull();
        assertThat(response.paymentId()).isEqualTo(existingPayment.getId());
        assertThat(response.status()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    @DisplayName("Same idempotency key with different payload throws 409 IDEMPOTENCY_CONFLICT")
    void testSameKeyDifferentPayloadConflict() {
        String idempotencyKey = "7b8f2f90-1234-4567";
        // New request has grossAmount 6000 instead of 5000
        var request = new CreatePaymentRequest(offerId, storeId, new BigDecimal("6000.00"), "INR");

        Payment existingPayment = new Payment();
        existingPayment.setId(UUID.randomUUID());
        existingPayment.setCustomerId(customerId);
        existingPayment.setStoreId(storeId);
        existingPayment.setOfferId(offerId);
        existingPayment.setGrossAmount(new BigDecimal("5000.00")); // stored with 5000
        existingPayment.setIdempotencyKey(idempotencyKey);

        when(paymentRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey))
                .thenReturn(Optional.of(existingPayment));

        assertThatThrownBy(() -> paymentService.initiatePayment(request, customerId, idempotencyKey, "req_2"))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.IDEMPOTENCY_CONFLICT);
    }

    @Test
    @DisplayName("Missing idempotency key throws 400 VALIDATION_FAILED")
    void testMissingIdempotencyKeyThrowsBadRequest() {
        var request = new CreatePaymentRequest(offerId, storeId, new BigDecimal("5000.00"), "INR");

        assertThatThrownBy(() -> paymentService.initiatePayment(request, customerId, null, "req_3"))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.VALIDATION_FAILED);

        assertThatThrownBy(() -> paymentService.initiatePayment(request, customerId, "   ", "req_3"))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.VALIDATION_FAILED);
    }

    @Test
    @DisplayName("Database duplicate key exception during race condition returns existing payment if matching")
    void testConcurrentRaceConditionReturnsExisting() {
        String idempotencyKey = "race_key_123";
        var request = new CreatePaymentRequest(offerId, storeId, new BigDecimal("5000.00"), "INR");

        when(paymentRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey))
                .thenReturn(Optional.empty()) // First check misses
                .thenReturn(Optional.of(createPayment(customerId, storeId, offerId, new BigDecimal("5000.00"), idempotencyKey))); // Race check finds it

        when(paymentValidator.validatePaymentInitiation(customerId, storeId, offerId))
                .thenReturn(new PaymentValidator.ValidatedEntities(customer, merchant, store, offer));

        when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // DB unique constraint triggers on saveAndFlush
        when(paymentRepository.saveAndFlush(any(Payment.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint"));

        PaymentResponse response = paymentService.initiatePayment(request, customerId, idempotencyKey, "req_race");
        assertThat(response).isNotNull();
        assertThat(response.grossAmount()).isEqualByComparingTo("5000.00");
    }

    private Payment createPayment(UUID customerId, UUID storeId, UUID offerId, BigDecimal gross, String key) {
        Payment p = new Payment();
        p.setId(UUID.randomUUID());
        p.setCustomerId(customerId);
        p.setStoreId(storeId);
        p.setOfferId(offerId);
        p.setGrossAmount(gross);
        p.setDiscountAmount(new BigDecimal("500.00"));
        p.setPayableAmount(gross.subtract(new BigDecimal("500.00")));
        p.setCurrency("INR");
        p.setStatus(PaymentStatus.PENDING);
        p.setIdempotencyKey(key);
        return p;
    }
}
