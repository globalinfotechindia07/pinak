package com.superapp.payment.service;

import com.superapp.payment.dto.InitiatePaymentRequest;
import com.superapp.payment.dto.PaymentResponse;
import com.superapp.payment.dto.PaymentWebhookRequest;
import com.superapp.payment.dto.RefundPaymentRequest;
import com.superapp.payment.entity.Payment;
import com.superapp.payment.entity.PaymentMethod;
import com.superapp.payment.entity.PaymentStatus;
import com.superapp.payment.mapper.PaymentMapper;
import com.superapp.payment.repository.PaymentRepository;
import com.superapp.payment.service.gateway.PaymentGatewayProvider;
import com.superapp.reward.service.RewardService;
import com.superapp.transactionhistory.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock PaymentRepository paymentRepository;
    @Mock PaymentGatewayProvider paymentGatewayProvider;
    @Spy PaymentMapper paymentMapper = new PaymentMapper();
    @Mock TransactionService transactionService;
    @Mock RewardService rewardService;

    @InjectMocks PaymentServiceImpl paymentService;

    private UUID customerId;
    private UUID merchantId;
    private Payment samplePayment;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        merchantId = UUID.randomUUID();
        samplePayment = new Payment("PAY_TEST123", customerId, merchantId, null, null,
                new BigDecimal("500.00"), "INR", PaymentMethod.UPI, "Test order");
        samplePayment.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("initiatePayment creates payment and prepares UPI intent")
    void initiatePayment_success() {
        var request = new InitiatePaymentRequest(
                new BigDecimal("500.00"), "INR", merchantId, null, null, PaymentMethod.UPI, "Test order"
        );

        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            if (p.getId() == null) p.setId(UUID.randomUUID());
            return p;
        });
        when(paymentGatewayProvider.createPaymentIntent(any(Payment.class)))
                .thenReturn(new PaymentGatewayProvider.PaymentGatewayOrder("UPI_ORD_123", "upi://pay?...", "qr_data"));

        PaymentResponse response = paymentService.initiatePayment(request, customerId);

        assertThat(response).isNotNull();
        assertThat(response.amount()).isEqualByComparingTo("500.00");
        assertThat(response.status()).isEqualTo(PaymentStatus.PENDING);
        assertThat(response.upiIntentUrl()).isEqualTo("upi://pay?...");
        verify(paymentRepository, times(2)).save(any(Payment.class));
    }

    @Test
    @DisplayName("processWebhook with SUCCESS marks payment successful, records transaction, and awards reward points")
    void processWebhook_success() {
        samplePayment.setStatus(PaymentStatus.PENDING);
        when(paymentGatewayProvider.verifyWebhookSignature(any(), any())).thenReturn(true);
        when(paymentRepository.findByPaymentReference("PAY_TEST123")).thenReturn(Optional.of(samplePayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));

        var webhook = new PaymentWebhookRequest(
                "PAY_TEST123", "GATEWAY_TXN_999", PaymentStatus.SUCCESS,
                new BigDecimal("500.00"), null, "sig123"
        );

        PaymentResponse response = paymentService.processWebhook(webhook);

        assertThat(response.status()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(samplePayment.getGatewayTransactionId()).isEqualTo("GATEWAY_TXN_999");
        verify(transactionService).recordTransaction(eq("PAY_TEST123"), any(), eq(customerId), eq(merchantId), any(), any(), any(), any(), any(), any());
        verify(rewardService).earnPoints(any());
    }

    @Test
    @DisplayName("refundPayment on successful payment transitions status to REFUNDED")
    void refundPayment_success() {
        samplePayment.setStatus(PaymentStatus.SUCCESS);
        when(paymentRepository.findById(samplePayment.getId())).thenReturn(Optional.of(samplePayment));
        when(paymentGatewayProvider.processRefund(any(), any(), any())).thenReturn(true);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));

        var refundRequest = new RefundPaymentRequest(new BigDecimal("500.00"), "Item returned");
        PaymentResponse response = paymentService.refundPayment(samplePayment.getId(), refundRequest);

        assertThat(response.status()).isEqualTo(PaymentStatus.REFUNDED);
        verify(transactionService).recordTransaction(contains("REF_"), any(), eq(customerId), eq(merchantId), any(), any(), any(), any(), any(), any());
    }
}
