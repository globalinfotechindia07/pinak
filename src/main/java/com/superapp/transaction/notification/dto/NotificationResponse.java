package com.superapp.transaction.notification.dto;

import com.superapp.transaction.notification.enums.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        String referenceType,
        String referenceId,
        boolean isRead,
        Instant createdAt
) {
}
