package com.superapp.transaction.notification.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateNotificationPreferenceRequest(
        @NotNull(message = "paymentNotifications is required")
        Boolean paymentNotifications,

        @NotNull(message = "rewardNotifications is required")
        Boolean rewardNotifications,

        @NotNull(message = "offerNotifications is required")
        Boolean offerNotifications,

        Boolean systemNotifications
) {
}
