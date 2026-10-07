package com.superapp.transaction.common;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.transaction.payment.enums.PaymentStatus;
import org.springframework.http.HttpStatus;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Enforces the payment lifecycle state machine.
 * Prevents arbitrary or out-of-order status updates.
 */
public final class PaymentStateMachine {

    private static final Map<PaymentStatus, Set<PaymentStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(PaymentStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(PaymentStatus.INITIATED, EnumSet.of(
                PaymentStatus.PENDING,
                PaymentStatus.FAILED,
                PaymentStatus.CANCELLED
        ));
        ALLOWED_TRANSITIONS.put(PaymentStatus.PENDING, EnumSet.of(
                PaymentStatus.SUCCESS,
                PaymentStatus.FAILED,
                PaymentStatus.CANCELLED
        ));
        ALLOWED_TRANSITIONS.put(PaymentStatus.SUCCESS, EnumSet.of(
                PaymentStatus.REFUNDED
        ));
        ALLOWED_TRANSITIONS.put(PaymentStatus.FAILED, EnumSet.noneOf(PaymentStatus.class));
        ALLOWED_TRANSITIONS.put(PaymentStatus.REFUNDED, EnumSet.noneOf(PaymentStatus.class));
        ALLOWED_TRANSITIONS.put(PaymentStatus.CANCELLED, EnumSet.noneOf(PaymentStatus.class));
    }

    private PaymentStateMachine() {}

    public static boolean isValidTransition(PaymentStatus current, PaymentStatus next) {
        if (current == null || next == null) {
            return false;
        }
        if (current == next) {
            return true; // Idempotent same-state check
        }
        Set<PaymentStatus> allowed = ALLOWED_TRANSITIONS.get(current);
        return allowed != null && allowed.contains(next);
    }

    public static void validateTransition(PaymentStatus current, PaymentStatus next) {
        if (!isValidTransition(current, next)) {
            throw new AppException(
                    "Invalid payment state transition from " + current + " to " + next,
                    ApiError.INVALID_PAYMENT_STATE,
                    409
            );
        }
    }

    public static boolean isCancellable(PaymentStatus status) {
        return status == PaymentStatus.INITIATED || status == PaymentStatus.PENDING;
    }
}
