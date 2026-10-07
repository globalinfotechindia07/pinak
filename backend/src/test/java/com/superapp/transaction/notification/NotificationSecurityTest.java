package com.superapp.transaction.notification;

import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.transaction.notification.entity.Notification;
import com.superapp.transaction.notification.enums.NotificationType;
import com.superapp.transaction.notification.mapper.NotificationMapper;
import com.superapp.transaction.notification.repository.NotificationPreferenceRepository;
import com.superapp.transaction.notification.repository.NotificationRepository;
import com.superapp.transaction.notification.service.NotificationCacheService;
import com.superapp.transaction.notification.service.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationSecurityTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationPreferenceRepository preferenceRepository;

    @Mock
    private NotificationCacheService cacheService;

    @Mock
    private AuditService auditService;

    private NotificationServiceImpl notificationService;

    private UUID customerAId;
    private UUID customerBId;
    private UUID notificationAId;
    private Notification notificationA;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(
                notificationRepository,
                preferenceRepository,
                cacheService,
                new NotificationMapper(),
                auditService
        );

        customerAId = UUID.randomUUID();
        customerBId = UUID.randomUUID();

        notificationAId = UUID.randomUUID();
        notificationA = new Notification(
                customerAId,
                NotificationType.PAYMENT_SUCCESS,
                "Payment Confirmed",
                "Your payment of ₹100 succeeded",
                "PAYMENT",
                "pay-123"
        );
        notificationA.setId(notificationAId);
    }

    @Test
    @DisplayName("BOLA/IDOR: Customer B should be forbidden from accessing Customer A's notification details")
    void testGetNotification_BolaProtection_AccessDenied() {
        when(notificationRepository.findById(notificationAId)).thenReturn(Optional.of(notificationA));

        AppException ex = assertThrows(AppException.class, () ->
                notificationService.getNotification(notificationAId, customerBId)
        );

        assertEquals(ApiError.NOTIFICATION_ACCESS_DENIED, ex.getErrorCode());
        assertEquals(403, ex.getHttpStatus());
    }

    @Test
    @DisplayName("BOLA/IDOR: Customer B should be forbidden from marking Customer A's notification as read")
    void testMarkAsRead_BolaProtection_AccessDenied() {
        when(notificationRepository.findById(notificationAId)).thenReturn(Optional.of(notificationA));

        AppException ex = assertThrows(AppException.class, () ->
                notificationService.markAsRead(notificationAId, customerBId)
        );

        assertEquals(ApiError.NOTIFICATION_ACCESS_DENIED, ex.getErrorCode());
        assertEquals(403, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Non-existent notification should return NOTIFICATION_NOT_FOUND (404)")
    void testGetNotification_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(notificationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                notificationService.getNotification(nonExistentId, customerAId)
        );

        assertEquals(ApiError.NOTIFICATION_NOT_FOUND, ex.getErrorCode());
        assertEquals(404, ex.getHttpStatus());
    }
}
