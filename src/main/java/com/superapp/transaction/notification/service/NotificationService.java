package com.superapp.transaction.notification.service;

import com.superapp.transaction.notification.dto.*;
import com.superapp.transaction.notification.enums.NotificationType;
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.redemption.entity.Redemption;
import com.superapp.transaction.reward.entity.RewardLedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    NotificationResponse createNotification(
            UUID userId, NotificationType type, String title, String message, String referenceType, String referenceId);

    void createPaymentNotification(Payment payment);

    void createRedemptionNotification(Redemption redemption);

    void createRewardNotification(RewardLedgerEntry entry);

    void createOfferNotification(UUID userId, NotificationType type, String title, String message, String offerId);

    Page<NotificationResponse> getUserNotifications(UUID userId, Boolean isRead, NotificationType type, Pageable pageable);

    NotificationDetailResponse getNotification(UUID notificationId, UUID userId);

    MarkReadResponse markAsRead(UUID notificationId, UUID userId);

    MarkAllReadResponse markAllAsRead(UUID userId);

    UnreadCountResponse getUnreadCount(UUID userId);

    NotificationPreferenceResponse getPreferences(UUID userId);

    NotificationPreferenceResponse updatePreferences(UUID userId, UpdateNotificationPreferenceRequest request);
}
