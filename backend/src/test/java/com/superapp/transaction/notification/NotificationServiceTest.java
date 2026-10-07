package com.superapp.transaction.notification;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.transaction.notification.dto.*;
import com.superapp.transaction.notification.entity.Notification;
import com.superapp.transaction.notification.entity.NotificationPreference;
import com.superapp.transaction.notification.enums.NotificationType;
import com.superapp.transaction.notification.mapper.NotificationMapper;
import com.superapp.transaction.notification.repository.NotificationPreferenceRepository;
import com.superapp.transaction.notification.repository.NotificationRepository;
import com.superapp.transaction.notification.service.NotificationCacheService;
import com.superapp.transaction.notification.service.NotificationServiceImpl;
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.enums.PaymentStatus;
import com.superapp.transaction.redemption.entity.Redemption;
import com.superapp.transaction.redemption.enums.RedemptionStatus;
import com.superapp.transaction.reward.entity.RewardLedgerEntry;
import com.superapp.transaction.reward.enums.RewardLedgerType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationPreferenceRepository preferenceRepository;

    @Mock
    private NotificationCacheService cacheService;

    @Mock
    private AuditService auditService;

    private NotificationServiceImpl notificationService;
    private final NotificationMapper mapper = new NotificationMapper();

    private UUID userId;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(
                notificationRepository,
                preferenceRepository,
                cacheService,
                mapper,
                auditService
        );
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Should successfully create a payment success notification when preference is enabled")
    void testCreatePaymentNotification_Success() {
        Payment payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setCustomerId(userId);
        payment.setPayableAmount(new BigDecimal("500.00"));
        payment.setStatus(PaymentStatus.SUCCESS);

        NotificationPreference preference = new NotificationPreference(userId);
        when(preferenceRepository.findByUserId(userId)).thenReturn(Optional.of(preference));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        notificationService.createPaymentNotification(payment);

        verify(notificationRepository).save(argThat(n ->
                n.getUserId().equals(userId) &&
                        n.getType() == NotificationType.PAYMENT_SUCCESS &&
                        n.getTitle().equals("Payment Successful") &&
                        n.getMessage().contains("500.00") &&
                        "PAYMENT".equals(n.getReferenceType()) &&
                        payment.getId().toString().equals(n.getReferenceId())
        ));
        verify(cacheService).incrementUnreadCount(userId);
        verify(auditService).record(eq(AuditEventType.NOTIFICATION_CREATED), eq(userId), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should suppress notification when preference for that type is disabled")
    void testCreateNotification_DisabledPreference() {
        NotificationPreference preference = new NotificationPreference(userId);
        preference.setPaymentNotifications(false);

        when(preferenceRepository.findByUserId(userId)).thenReturn(Optional.of(preference));

        NotificationResponse response = notificationService.createNotification(
                userId,
                NotificationType.PAYMENT_SUCCESS,
                "Payment Successful",
                "Paid 100",
                "PAYMENT",
                "123"
        );

        assertNull(response);
        verify(notificationRepository, never()).save(any());
        verify(cacheService, never()).incrementUnreadCount(any());
    }

    @Test
    @DisplayName("System notifications should always be delivered even if optional preferences are false")
    void testCreateNotification_SystemNotification_AlwaysDelivered() {
        NotificationPreference preference = new NotificationPreference(userId);
        preference.setPaymentNotifications(false);
        preference.setRewardNotifications(false);
        preference.setOfferNotifications(false);

        when(preferenceRepository.findByUserId(userId)).thenReturn(Optional.of(preference));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        NotificationResponse response = notificationService.createNotification(
                userId,
                NotificationType.SYSTEM,
                "Security Alert",
                "Password changed",
                "SYSTEM",
                "SYS-1"
        );

        assertNotNull(response);
        assertEquals(NotificationType.SYSTEM, response.type());
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("Should create redemption success notification")
    void testCreateRedemptionNotification_Success() {
        Redemption redemption = new Redemption();
        redemption.setId(UUID.randomUUID());
        redemption.setCustomerId(userId);
        redemption.setRedeemedAmount(new BigDecimal("150.00"));
        redemption.setStatus(RedemptionStatus.SUCCESS);

        when(preferenceRepository.findByUserId(userId)).thenReturn(Optional.of(new NotificationPreference(userId)));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        notificationService.createRedemptionNotification(redemption);

        verify(notificationRepository).save(argThat(n ->
                n.getType() == NotificationType.REDEMPTION_SUCCESS &&
                        n.getMessage().contains("150.00") &&
                        "REDEMPTION".equals(n.getReferenceType())
        ));
    }

    @Test
    @DisplayName("Should create reward credit and reversal notifications")
    void testCreateRewardNotification_CreditAndReversal() {
        RewardLedgerEntry creditEntry = new RewardLedgerEntry();
        creditEntry.setId(UUID.randomUUID());
        creditEntry.setCustomerId(userId);
        creditEntry.setAmount(new BigDecimal("50.00"));
        creditEntry.setType(RewardLedgerType.CREDIT);

        when(preferenceRepository.findByUserId(userId)).thenReturn(Optional.of(new NotificationPreference(userId)));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        notificationService.createRewardNotification(creditEntry);

        verify(notificationRepository).save(argThat(n ->
                n.getType() == NotificationType.REWARD_CREDITED &&
                        n.getMessage().contains("50.00")
        ));

        RewardLedgerEntry reversalEntry = new RewardLedgerEntry();
        reversalEntry.setId(UUID.randomUUID());
        reversalEntry.setCustomerId(userId);
        reversalEntry.setAmount(new BigDecimal("50.00"));
        reversalEntry.setType(RewardLedgerType.REVERSAL);

        notificationService.createRewardNotification(reversalEntry);

        verify(notificationRepository).save(argThat(n ->
                n.getType() == NotificationType.REWARD_REVERSED &&
                        n.getMessage().contains("50.00")
        ));
    }

    @Test
    @DisplayName("Should retrieve notification details when owned by the user")
    void testGetNotification_Success() {
        UUID notifId = UUID.randomUUID();
        Notification notification = new Notification(userId, NotificationType.PAYMENT_SUCCESS, "Title", "Msg", "PAYMENT", "123");
        notification.setId(notifId);

        when(notificationRepository.findById(notifId)).thenReturn(Optional.of(notification));

        NotificationDetailResponse res = notificationService.getNotification(notifId, userId);
        assertNotNull(res);
        assertEquals(notifId, res.id());
        assertEquals("Title", res.title());
    }

    @Test
    @DisplayName("Should reject retrieval if notification does not exist")
    void testGetNotification_NotFound() {
        UUID notifId = UUID.randomUUID();
        when(notificationRepository.findById(notifId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> notificationService.getNotification(notifId, userId));
        assertEquals(ApiError.NOTIFICATION_NOT_FOUND, ex.getErrorCode());
        assertEquals(404, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should reject retrieval if notification belongs to another user (IDOR protection)")
    void testGetNotification_AccessDenied() {
        UUID notifId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        Notification notification = new Notification(otherUserId, NotificationType.PAYMENT_SUCCESS, "Title", "Msg", "PAYMENT", "123");
        notification.setId(notifId);

        when(notificationRepository.findById(notifId)).thenReturn(Optional.of(notification));

        AppException ex = assertThrows(AppException.class, () -> notificationService.getNotification(notifId, userId));
        assertEquals(ApiError.NOTIFICATION_ACCESS_DENIED, ex.getErrorCode());
        assertEquals(403, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Should mark single notification as read and invalidate cache")
    void testMarkAsRead_Success() {
        UUID notifId = UUID.randomUUID();
        Notification notification = new Notification(userId, NotificationType.PAYMENT_SUCCESS, "Title", "Msg", "PAYMENT", "123");
        notification.setId(notifId);
        notification.setRead(false);

        when(notificationRepository.findById(notifId)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        MarkReadResponse response = notificationService.markAsRead(notifId, userId);
        assertTrue(response.isRead());
        assertNotNull(response.readAt());
        verify(cacheService).evictUnreadCount(userId);
        verify(auditService).record(eq(AuditEventType.NOTIFICATION_READ), eq(userId), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should mark all notifications as read and reset cache")
    void testMarkAllAsRead_Success() {
        when(notificationRepository.markAllAsRead(eq(userId), any(Instant.class))).thenReturn(5);

        MarkAllReadResponse response = notificationService.markAllAsRead(userId);
        assertEquals(5, response.updatedCount());
        verify(cacheService).putUnreadCount(userId, 0);
        verify(auditService).record(eq(AuditEventType.NOTIFICATION_ALL_READ), eq(userId), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should fetch unread count from Redis cache when available")
    void testGetUnreadCount_CacheHit() {
        when(cacheService.getUnreadCount(userId)).thenReturn(Optional.of(3L));

        UnreadCountResponse response = notificationService.getUnreadCount(userId);
        assertEquals(3L, response.unreadCount());
        verify(notificationRepository, never()).countByUserIdAndIsReadFalse(any());
    }

    @Test
    @DisplayName("Should fetch unread count from DB and populate cache on cache miss")
    void testGetUnreadCount_CacheMiss() {
        when(cacheService.getUnreadCount(userId)).thenReturn(Optional.empty());
        when(notificationRepository.countByUserIdAndIsReadFalse(userId)).thenReturn(7L);

        UnreadCountResponse response = notificationService.getUnreadCount(userId);
        assertEquals(7L, response.unreadCount());
        verify(cacheService).putUnreadCount(userId, 7L);
    }

    @Test
    @DisplayName("Should get and update notification preferences")
    void testGetAndUpdatePreferences() {
        NotificationPreference existing = new NotificationPreference(userId);
        when(preferenceRepository.findByUserId(userId)).thenReturn(Optional.of(existing));
        when(preferenceRepository.save(any(NotificationPreference.class))).thenAnswer(inv -> inv.getArgument(0));

        NotificationPreferenceResponse prefRes = notificationService.getPreferences(userId);
        assertTrue(prefRes.paymentNotifications());
        assertTrue(prefRes.rewardNotifications());

        UpdateNotificationPreferenceRequest updateReq = new UpdateNotificationPreferenceRequest(
                false, true, false, true
        );
        NotificationPreferenceResponse updated = notificationService.updatePreferences(userId, updateReq);
        assertFalse(updated.paymentNotifications());
        assertTrue(updated.rewardNotifications());
        assertFalse(updated.offerNotifications());
        assertTrue(updated.systemNotifications());
        verify(auditService).record(eq(AuditEventType.NOTIFICATION_PREFERENCES_UPDATED), eq(userId), any(), any(), any(), any());
    }
}
