package com.superapp.transaction.notification.mapper;

import com.superapp.transaction.notification.dto.NotificationDetailResponse;
import com.superapp.transaction.notification.dto.NotificationPreferenceResponse;
import com.superapp.transaction.notification.dto.NotificationResponse;
import com.superapp.transaction.notification.entity.Notification;
import com.superapp.transaction.notification.entity.NotificationPreference;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification entity) {
        if (entity == null) return null;
        return new NotificationResponse(
                entity.getId(),
                entity.getType(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getReferenceType(),
                entity.getReferenceId(),
                entity.isRead(),
                entity.getCreatedAt()
        );
    }

    public NotificationDetailResponse toDetailResponse(Notification entity) {
        if (entity == null) return null;
        return new NotificationDetailResponse(
                entity.getId(),
                entity.getType(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getReferenceType(),
                entity.getReferenceId(),
                entity.isRead(),
                entity.getCreatedAt(),
                entity.getReadAt()
        );
    }

    public NotificationPreferenceResponse toPreferenceResponse(NotificationPreference entity) {
        if (entity == null) return null;
        return new NotificationPreferenceResponse(
                entity.isPaymentNotifications(),
                entity.isRewardNotifications(),
                entity.isOfferNotifications(),
                entity.isSystemNotifications(),
                entity.getUpdatedAt()
        );
    }
}
