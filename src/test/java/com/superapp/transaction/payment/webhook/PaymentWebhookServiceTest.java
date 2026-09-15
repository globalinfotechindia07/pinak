package com.superapp.transaction.payment.webhook;

import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.enums.PaymentStatus;
import com.superapp.transaction.payment.provider.PaymentProvider;
import com.superapp.transaction.payment.provider.ProviderWebhookEvent;
import com.superapp.transaction.payment.repository.PaymentRepository;
import com.superapp.transaction.payment.repository.WebhookEventRepository;
import com.superapp.transaction.transaction.entity.Transaction;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentWebhookServiceTest {

    @Mock private PaymentProvider paymentProvider;
    @Mock private WebhookEventRepository webhookEventRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private AuditService auditService;

    private PaymentWebhookServiceImpl paymentWebhookService;

    private UUID paymentId;
    private UUID txId;
    private Payment payment;
    private Transaction transaction;

    @BeforeEach
    void setUp() {
        when(paymentProvider.getProviderName()).thenReturn("MOCK_UPI");

        paymentWebhookService = new PaymentWebhookServiceImpl(
                List.of(paymentProvider),
                webhookEventRepository,
                paymentRepository,
                transactionRepository,
                auditService
        );

        paymentId = UUID.randomUUID();
        txId = UUID.randomUUID();

        payment = new Payment();
        payment.setId(paymentId);
        payment.setTransactionId(txId);
        payment.setProviderOrderId("ord_123");
        payment.setPayableAmount(new BigDecimal("4500.00"));
        payment.setCurrency("INR");
        payment.setStatus(PaymentStatus.PENDING);

        transaction = new Transaction();
        transaction.setId(txId);
        transaction.setPaymentId(paymentId);
        transaction.setStatus(TransactionStatus.PENDING);
    }

    @Test
    @DisplayName("Invalid webhook signature is rejected with 400 WEBHOOK_SIGNATURE_INVALID")
    void testInvalidSignatureRejected() {
        when(paymentProvider.verifyWebhookSignature(any(), eq("invalid_sig"))).thenReturn(false);

        assertThatThrownBy(() -> paymentWebhookService.processWebhook("MOCK_UPI", "{}", "invalid_sig", "req_1"))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.WEBHOOK_SIGNATURE_INVALID);

        verify(auditService).record(eq(com.superapp.common.audit.AuditEventType.WEBHOOK_REJECTED), isNull(), any(), any(), eq("req_1"), any());
    }

    @Test
    @DisplayName("Duplicate webhook event is safely ignored without re-processing")
    void testDuplicateWebhookEventSafelyIgnored() {
        when(paymentProvider.verifyWebhookSignature(any(), any())).thenReturn(true);
        var event = new ProviderWebhookEvent(
                "evt_duplicate", "payment.success", paymentId, "ord_123",
                "gw_pay_1", new BigDecimal("4500.00"), "INR", PaymentStatus.SUCCESS, null, null
        );
        when(paymentProvider.parseWebhookEvent(any())).thenReturn(event);
        when(webhookEventRepository.existsByProviderAndProviderEventId("MOCK_UPI", "evt_duplicate")).thenReturn(true);

        Map<String, Object> result = paymentWebhookService.processWebhook("MOCK_UPI", "{}", "valid_sig", "req_2");

        assertThat(result.get("status")).isEqualTo("ALREADY_PROCESSED");
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Webhook successfully confirms payment and updates transaction to SUCCESS")
    void testWebhookSuccessUpdatesState() {
        when(paymentProvider.verifyWebhookSignature(any(), any())).thenReturn(true);
        var event = new ProviderWebhookEvent(
                "evt_new", "payment.success", paymentId, "ord_123",
                "gw_pay_1", new BigDecimal("4500.00"), "INR", PaymentStatus.SUCCESS, null, null
        );
        when(paymentProvider.parseWebhookEvent(any())).thenReturn(event);
        when(webhookEventRepository.existsByProviderAndProviderEventId("MOCK_UPI", "evt_new")).thenReturn(false);
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(transactionRepository.findById(txId)).thenReturn(Optional.of(transaction));

        Map<String, Object> result = paymentWebhookService.processWebhook("MOCK_UPI", "{}", "valid_sig", "req_3");

        assertThat(result.get("status")).isEqualTo("SUCCESS");
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(payment.getProviderPaymentId()).isEqualTo("gw_pay_1");
        assertThat(payment.getPaidAt()).isNotNull();
        assertThat(transaction.getStatus()).isEqualTo(TransactionStatus.SUCCESS);

        verify(paymentRepository).save(payment);
        verify(transactionRepository).save(transaction);
        verify(auditService).record(eq(com.superapp.common.audit.AuditEventType.PAYMENT_SUCCESS), any(), any(), any(), eq("req_3"), any());
    }

    @Test
    @DisplayName("Amount mismatch in webhook payload is rejected")
    void testAmountMismatchRejected() {
        when(paymentProvider.verifyWebhookSignature(any(), any())).thenReturn(true);
        // Event amount is 3000 instead of 4500
        var event = new ProviderWebhookEvent(
                "evt_mismatch", "payment.success", paymentId, "ord_123",
                "gw_pay_1", new BigDecimal("3000.00"), "INR", PaymentStatus.SUCCESS, null, null
        );
        when(paymentProvider.parseWebhookEvent(any())).thenReturn(event);
        when(webhookEventRepository.existsByProviderAndProviderEventId("MOCK_UPI", "evt_mismatch")).thenReturn(false);
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentWebhookService.processWebhook("MOCK_UPI", "{}", "valid_sig", "req_4"))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.VALIDATION_FAILED);
    }
}
