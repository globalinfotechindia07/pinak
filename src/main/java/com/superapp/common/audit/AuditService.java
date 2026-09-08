package com.superapp.common.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Writes audit events to the database asynchronously.
 * Using @Async ensures audit logging never slows down the primary request.
 * <p>
 * NEVER log: password, OTP, access token, refresh token, JWT secret, payment credentials.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Records a security-sensitive event to the audit log (async).
     *
     * @param eventType  the type of event
     * @param userId     the affected user ID (may be null for anonymous events)
     * @param ipAddress  client IP address
     * @param userAgent  client User-Agent header
     * @param requestId  the X-Request-ID correlation ID
     * @param metadata   optional JSON string with additional context (device name, reason, etc.)
     */
    @Async
    public void record(AuditEventType eventType, UUID userId,
                       String ipAddress, String userAgent,
                       String requestId, String metadata) {
        try {
            AuditLog entry = AuditLog.of(eventType, userId, ipAddress, userAgent, requestId, metadata);
            auditLogRepository.save(entry);
            log.debug("Audit event recorded: {} for user={}", eventType, userId);
        } catch (Exception ex) {
            // Audit failure must never break the main flow
            log.error("Failed to persist audit log for event={}, user={}: {}", eventType, userId, ex.getMessage());
        }
    }

    /** Convenience overload without metadata. */
    @Async
    public void record(AuditEventType eventType, UUID userId,
                       String ipAddress, String userAgent, String requestId) {
        record(eventType, userId, ipAddress, userAgent, requestId, null);
    }
}
