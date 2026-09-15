package com.superapp.transaction.common;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.transaction.payment.enums.PaymentStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaymentStateMachineTest {

    @Test
    @DisplayName("Allows valid forward transitions in normal lifecycle")
    void testValidTransitions() {
        assertThat(PaymentStateMachine.isValidTransition(PaymentStatus.INITIATED, PaymentStatus.PENDING)).isTrue();
        assertThat(PaymentStateMachine.isValidTransition(PaymentStatus.PENDING, PaymentStatus.SUCCESS)).isTrue();
        assertThat(PaymentStateMachine.isValidTransition(PaymentStatus.PENDING, PaymentStatus.FAILED)).isTrue();
        assertThat(PaymentStateMachine.isValidTransition(PaymentStatus.INITIATED, PaymentStatus.CANCELLED)).isTrue();
        assertThat(PaymentStateMachine.isValidTransition(PaymentStatus.PENDING, PaymentStatus.CANCELLED)).isTrue();
        assertThat(PaymentStateMachine.isValidTransition(PaymentStatus.SUCCESS, PaymentStatus.REFUNDED)).isTrue();
    }

    @Test
    @DisplayName("Blocks illegal backward and terminal transitions")
    void testIllegalTransitions() {
        assertThat(PaymentStateMachine.isValidTransition(PaymentStatus.SUCCESS, PaymentStatus.CANCELLED)).isFalse();
        assertThat(PaymentStateMachine.isValidTransition(PaymentStatus.FAILED, PaymentStatus.SUCCESS)).isFalse();
        assertThat(PaymentStateMachine.isValidTransition(PaymentStatus.REFUNDED, PaymentStatus.SUCCESS)).isFalse();
        assertThat(PaymentStateMachine.isValidTransition(PaymentStatus.CANCELLED, PaymentStatus.PENDING)).isFalse();

        assertThatThrownBy(() -> PaymentStateMachine.validateTransition(PaymentStatus.SUCCESS, PaymentStatus.CANCELLED))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.INVALID_PAYMENT_STATE);
    }

    @Test
    @DisplayName("isCancellable correctly identifies only INITIATED and PENDING states")
    void testIsCancellable() {
        assertThat(PaymentStateMachine.isCancellable(PaymentStatus.INITIATED)).isTrue();
        assertThat(PaymentStateMachine.isCancellable(PaymentStatus.PENDING)).isTrue();
        assertThat(PaymentStateMachine.isCancellable(PaymentStatus.SUCCESS)).isFalse();
        assertThat(PaymentStateMachine.isCancellable(PaymentStatus.FAILED)).isFalse();
        assertThat(PaymentStateMachine.isCancellable(PaymentStatus.CANCELLED)).isFalse();
        assertThat(PaymentStateMachine.isCancellable(PaymentStatus.REFUNDED)).isFalse();
    }
}
