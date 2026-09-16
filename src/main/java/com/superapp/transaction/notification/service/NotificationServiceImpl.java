package com.superapp.transaction.notification.service;

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
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.enums.PaymentStatus;
import com.superapp.transaction.redemption.entity.Redemption;
import com.superapp.transaction.redemption.enums.RedemptionStatus;
import com.superapp.transaction.reward.entity.RewardLedgerEntry;
import com.superapp.transaction.reward.enums.RewardLedgerType;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final NotificationCacheService cacheService;
    private final NotificationMapper mapper;
    private final AuditService auditService;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            NotificationPreferenceRepository preferenceRepository,
            NotificationCacheService cacheService,
            NotificationMapper mapper,
            AuditService auditService) {
        this.notificationRepository = notificationRepository;
        this.preferenceRepository = preferenceRepository;
        this.cacheService = cacheService;
        this.mapper = mapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public NotificationResponse createNotification(
            UUID userId, NotificationType type, String title, String message, String referenceType, String referenceId) {

        if (userId == null || type == null) {
            log.warn("Cannot create notification with null userId or type");
            return null;
        }

        // Check user preferences
        NotificationPreference preference = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> preferenceRepository.save(new NotificationPreference(userId)));

        if (!isNotificationEnabled(preference, type)) {
            log.info("Notification type={} suppressed by user preferences for userId={}", type, userId);
            return null;
        }

        Notification notification = new Notification(userId, type, title, message, referenceType, referenceId);
        Notification saved = notificationRepository.save(notification);

        // Update / evict Redis cache
        cacheService.incrementUnreadCount(userId);

        try {
            auditService.record(AuditEventType.NOTIFICATION_CREATED, userId, null, null, null,
                    "Notification created: " + saved.getId() + " type=" + type.name());
        } catch (Exception ex) {
            log.warn("Failed to audit notification creation: {}", ex.getMessage());
        }

        return mapper.toResponse(saved);
    }

    private boolean isNotificationEnabled(NotificationPreference pref, NotificationType type) {
        return switch (type) {
            case PAYMENT_SUCCESS, PAYMENT_FAILED -> pref.isPaymentNotifications();
            case REDEMPTION_SUCCESS, REDEMPTION_FAILED -> pref.isOfferNotifications() || pref.isRewardNotifications();
            case REWARD_CREDITED, REWARD_REVERSED -> pref.isRewardNotifications();
            case OFFER_EXPIRING, OFFER_EXPIRED -> pref.isOfferNotifications();
            case SYSTEM -> true; // System security/platform notifications are always enabled
        };
    }

    @Override
    public void createPaymentNotification(Payment payment) {
        if (payment == null || payment.getCustomerId() == null) return;
        try {
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                createNotification(
                        payment.getCustomerId(),
                        NotificationType.PAYMENT_SUCCESS,
                        "Payment Successful",
                        "Your payment of ₹" + payment.getPayableAmount() + " was successful.",
                        "PAYMENT",
                        payment.getId().toString()
                );
            } else if (payment.getStatus() == PaymentStatus.FAILED) {
                String reason = payment.getFailureReason() != null ? payment.getFailureReason() : "Transaction declined";
                createNotification(
                        payment.getCustomerId(),
                        NotificationType.PAYMENT_FAILED,
                        "Payment Failed",
                        "Your payment of ₹" + payment.getPayableAmount() + " failed: " + reason,
                        "PAYMENT",
                        payment.getId().toString()
                );
            }
        } catch (Exception ex) {
            log.error("Failed to dispatch payment notification for paymentId={}: {}", payment.getId(), ex.getMessage());
        }
    }

    @Override
    public void createRedemptionNotification(Redemption redemption) {
        if (redemption == null || redemption.getCustomerId() == null) return;
        try {
            if (redemption.getStatus() == RedemptionStatus.SUCCESS) {
                createNotification(
                        redemption.getCustomerId(),
                        NotificationType.REDEMPTION_SUCCESS,
                        "Redemption Successful",
                        "Offer successfully redeemed! Amount: ₹" + redemption.getRedeemedAmount(),
                        "REDEMPTION",
                        redemption.getId().toString()
                );
            } else if (redemption.getStatus() == RedemptionStatus.FAILED) {
                createNotification(
                        redemption.getCustomerId(),
                        NotificationType.REDEMPTION_FAILED,
                        "Redemption Failed",
                        "Offer redemption could not be completed.",
                        "REDEMPTION",
                        redemption.getId().toString()
                );
            }
        } catch (Exception ex) {
            log.error("Failed to dispatch redemption notification for redemptionId={}: {}", redemption.getId(), ex.getMessage());
        }
    }

    @Override
    public void createRewardNotification(RewardLedgerEntry entry) {
        if (entry == null || entry.getCustomerId() == null) return;
        try {
            String refId = entry.getId() != null ? entry.getId().toString() : entry.getReferenceId();
            if (entry.getType() == RewardLedgerType.CREDIT) {
                createNotification(
                        entry.getCustomerId(),
                        NotificationType.REWARD_CREDITED,
                        "Reward Credited",
                        "₹" + entry.getAmount() + " reward has been credited to your account.",
                        "REWARD",
                        refId
                );
            } else if (entry.getType() == RewardLedgerType.REVERSAL) {
                createNotification(
                        entry.getCustomerId(),
                        NotificationType.REWARD_REVERSED,
                        "Reward Reversed",
                        "₹" + entry.getAmount() + " reward has been reversed.",
                        "REWARD",
                        refId
                );
            }
        } catch (Exception ex) {
            log.error("Failed to dispatch reward notification: {}", ex.getMessage());
        }
    }

    @Override
    public void createOfferNotification(UUID userId, NotificationType type, String title, String message, String offerId) {
        if (userId == null) return;
        try {
            createNotification(userId, type, title, message, "OFFER", offerId);
        } catch (Exception ex) {
            log.error("Failed to dispatch offer notification for userId={}: {}", userId, ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(
            UUID userId, Boolean isRead, NotificationType type, Pageable pageable) {

        int pageSize = Math.min(Math.max(pageable.getPageSize(), 1), 100);
        Pageable effectivePageable = PageRequest.of(
                Math.max(pageable.getPageNumber(), 0),
                pageSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Specification<Notification> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("userId"), userId));
            if (isRead != null) {
                predicates.add(cb.equal(root.get("isRead"), isRead));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return notificationRepository.findAll(spec, effectivePageable).map(mapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationDetailResponse getNotification(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException("Notification not found", ApiError.NOTIFICATION_NOT_FOUND, 404));

        if (!Objects.equals(notification.getUserId(), userId)) {
            throw new AppException("Access denied to notification", ApiError.NOTIFICATION_ACCESS_DENIED, 403);
        }

        return mapper.toDetailResponse(notification);
    }

    @Override
    @Transactional
    public MarkReadResponse markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException("Notification not found", ApiError.NOTIFICATION_NOT_FOUND, 404));

        if (!Objects.equals(notification.getUserId(), userId)) {
            throw new AppException("Access denied to notification", ApiError.NOTIFICATION_ACCESS_DENIED, 403);
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notificationRepository.save(notification);
            cacheService.evictUnreadCount(userId);

            try {
                auditService.record(AuditEventType.NOTIFICATION_READ, userId, null, null, null,
                        "Notification marked as read: " + notificationId);
            } catch (Exception ex) {
                log.warn("Failed to audit notification read: {}", ex.getMessage());
            }
        }

        return new MarkReadResponse(notification.getId(), notification.isRead(), notification.getReadAt());
    }

    @Override
    @Transactional
    public MarkAllReadResponse markAllAsRead(UUID userId) {
        int updatedCount = notificationRepository.markAllAsRead(userId, Instant.now());
        cacheService.putUnreadCount(userId, 0);

        try {
            auditService.record(AuditEventType.NOTIFICATION_ALL_READ, userId, null, null, null,
                    "Marked " + updatedCount + " notifications as read");
        } catch (Exception ex) {
            log.warn("Failed to audit mark all notifications read: {}", ex.getMessage());
        }

        return new MarkAllReadResponse(updatedCount);
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(UUID userId) {
        return cacheService.getUnreadCount(userId)
                .map(UnreadCountResponse::new)
                .orElseGet(() -> {
                    long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
                    cacheService.putUnreadCount(userId, count);
                    return new UnreadCountResponse(count);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPreferenceResponse getPreferences(UUID userId) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> preferenceRepository.save(new NotificationPreference(userId)));
        return mapper.toPreferenceResponse(pref);
    }

    @Override
    @Transactional
    public NotificationPreferenceResponse updatePreferences(UUID userId, UpdateNotificationPreferenceRequest request) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> new NotificationPreference(userId));

        pref.setPaymentNotifications(request.paymentNotifications());
        pref.setRewardNotifications(request.rewardNotifications());
        pref.setOfferNotifications(request.offerNotifications());
        if (request.systemNotifications() != null) {
            // System notifications can be specified or kept true
            pref.setSystemNotifications(request.systemNotifications());
        }
        pref.setUpdatedAt(Instant.now());

        NotificationPreference saved = preferenceRepository.save(pref);

        try {
            auditService.record(AuditEventType.NOTIFICATION_PREFERENCES_UPDATED, userId, null, null, null,
                    "Updated notification preferences");
        } catch (Exception ex) {
            log.warn("Failed to audit preferences update: {}", ex.getMessage());
        }

        return mapper.toPreferenceResponse(saved);
    }
}
