package com.superapp.transaction.notification.dto;

import java.time.Instant;

public record NotificationPreferenceResponse(
        boolean paymentNotifications,
        boolean rewardNotifications,
        boolean offerNotifications,
        boolean systemNotifications,
        Instant updatedAt
) {
}
