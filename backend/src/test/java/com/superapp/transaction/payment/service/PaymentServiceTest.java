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
import com.superapp.transaction.payment.dto.PaymentCancelResponse;
import com.superapp.transaction.payment.dto.PaymentResponse;
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.enums.PaymentIntentType;
import com.superapp.transaction.payment.enums.PaymentStatus;
import com.superapp.transaction.payment.mapper.PaymentMapper;
import com.superapp.transaction.payment.provider.PaymentProvider;
import com.superapp.transaction.payment.provider.ProviderOrderResponse;
import com.superapp.transaction.payment.repository.PaymentRepository;
import com.superapp.transaction.payment.validation.PaymentValidator;
import com.superapp.transaction.transaction.entity.Transaction;
import com.superapp.transaction.transaction.enums.TransactionStatus;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

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
        offer.setValue(new BigDecimal("10.00")); // 10%
        offer.setValidFrom(Instant.now().minus(1, ChronoUnit.DAYS));
        offer.setValidTo(Instant.now().plus(1, ChronoUnit.DAYS));
    }

    @Test
    @DisplayName("Successfully initiates payment with valid offer and provider intent")
    void testInitiatePaymentSuccess() {
        var request = new CreatePaymentRequest(offerId, storeId, new BigDecimal("5000.00"), "INR");
        String idempotencyKey = "idemp_key_123";

        when(paymentRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey))
                .thenReturn(Optional.empty());

        when(paymentValidator.validatePaymentInitiation(customerId, storeId, offerId))
                .thenReturn(new PaymentValidator.ValidatedEntities(customer, merchant, store, offer));

        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> {
            Transaction tx = inv.getArgument(0);
            tx.setId(UUID.randomUUID());
            return tx;
        });

        when(paymentRepository.saveAndFlush(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        ProviderOrderResponse providerOrder = new ProviderOrderResponse(
                "MOCK_UPI", "ord_test_123", PaymentIntentType.UPI, "upi://pay?pa=test",
                Instant.now().plus(15, ChronoUnit.MINUTES)
        );
        when(paymentProvider.createOrder(any(Payment.class))).thenReturn(providerOrder);

        PaymentResponse response = paymentService.initiatePayment(request, customerId, idempotencyKey, "req_123");

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(PaymentStatus.PENDING);
        assertThat(response.grossAmount()).isEqualByComparingTo("5000.00");
        assertThat(response.discountAmount()).isEqualByComparingTo("500.00"); // 10%
        assertThat(response.payableAmount()).isEqualByComparingTo("4500.00");
        assertThat(response.providerOrderId()).isEqualTo("ord_test_123");
        assertThat(response.paymentIntent()).isNotNull();
        assertThat(response.paymentIntent().type()).isEqualTo("UPI");
        assertThat(response.paymentIntent().value()).isEqualTo("upi://pay?pa=test");

        verify(auditService, atLeastOnce()).record(eq(com.superapp.common.audit.AuditEventType.PAYMENT_INITIATED), eq(customerId), any(), any(), eq("req_123"), any());
    }

    @Test
    @DisplayName("Customer cannot access payment belonging to another customer")
    void testGetPaymentAccessDenied() {
        UUID paymentId = UUID.randomUUID();
        UUID otherCustomerId = UUID.randomUUID();

        Payment payment = new Payment();
        payment.setId(paymentId);
        payment.setCustomerId(otherCustomerId);
        payment.setStatus(PaymentStatus.SUCCESS);

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.getPaymentById(paymentId, customerId, false))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.PAYMENT_ACCESS_DENIED);
    }

    @Test
    @DisplayName("Admin can access any customer's payment")
    void testAdminCanAccessAnyPayment() {
        UUID paymentId = UUID.randomUUID();
        UUID otherCustomerId = UUID.randomUUID();

        Payment payment = new Payment();
        payment.setId(paymentId);
        payment.setCustomerId(otherCustomerId);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setGrossAmount(new BigDecimal("100.00"));
        payment.setDiscountAmount(BigDecimal.ZERO);
        payment.setPayableAmount(new BigDecimal("100.00"));
        payment.setCurrency("INR");

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.getPaymentById(paymentId, customerId, true);
        assertThat(response).isNotNull();
        assertThat(response.paymentId()).isEqualTo(paymentId);
    }

    @Test
    @DisplayName("Customer can cancel their pending payment")
    void testCancelPendingPaymentSuccess() {
        UUID paymentId = UUID.randomUUID();
        UUID txId = UUID.randomUUID();

        Payment payment = new Payment();
        payment.setId(paymentId);
        payment.setCustomerId(customerId);
        payment.setTransactionId(txId);
        payment.setStatus(PaymentStatus.PENDING);

        Transaction tx = new Transaction();
        tx.setId(txId);
        tx.setStatus(TransactionStatus.PENDING);

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.findById(txId)).thenReturn(Optional.of(tx));

        PaymentCancelResponse response = paymentService.cancelPayment(paymentId, customerId, false);

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(tx.getStatus()).isEqualTo(TransactionStatus.CANCELLED);
    }

    @Test
    @DisplayName("Cannot cancel a payment that is already in SUCCESS state")
    void testCancelSuccessfulPaymentFails() {
        UUID paymentId = UUID.randomUUID();

        Payment payment = new Payment();
        payment.setId(paymentId);
        payment.setCustomerId(customerId);
        payment.setStatus(PaymentStatus.SUCCESS);

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.cancelPayment(paymentId, customerId, false))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.INVALID_PAYMENT_STATE);
    }
}
