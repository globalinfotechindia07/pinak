package com.superapp.payment;

import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.payment.dto.PaymentStatusResponse;
import com.superapp.payment.entity.Payment;
import com.superapp.payment.entity.PaymentMethod;
import com.superapp.payment.entity.PaymentStatus;
import com.superapp.payment.repository.PaymentRepository;
import com.superapp.payment.service.PaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentStatusTest {

    @Mock private PaymentRepository paymentRepository;

    @InjectMocks private PaymentServiceImpl paymentService;

    private UUID paymentId;
    private Payment payment;

    @BeforeEach
    void setUp() {
        paymentId = UUID.randomUUID();
        payment = new Payment(
                "PAY_TEST_12345",
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                new BigDecimal("500.00"),
                "INR",
                PaymentMethod.UPI,
                "Test payment"
        );
        payment.setId(paymentId);
        payment.setStatus(PaymentStatus.PENDING);
    }

    @Test
    @DisplayName("Get payment status by ID succeeds")
    void getPaymentStatus_success() {
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        PaymentStatusResponse response = paymentService.getPaymentStatus(paymentId);

        assertThat(response).isNotNull();
        assertThat(response.paymentId()).isEqualTo(paymentId);
        assertThat(response.status()).isEqualTo(PaymentStatus.PENDING);
        assertThat(response.paymentReference()).isEqualTo("PAY_TEST_12345");
        assertThat(response.amount()).isEqualTo(new BigDecimal("500.00"));
    }

    @Test
    @DisplayName("Get payment status for unknown ID throws ResourceNotFoundException")
    void getPaymentStatus_notFound_throwsException() {
        UUID unknownId = UUID.randomUUID();
        when(paymentRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getPaymentStatus(unknownId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
