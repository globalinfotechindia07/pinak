package com.superapp.common.audit;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Admin audit log record response")
public record AuditLogResponse(
        UUID id,
        UUID adminUserId,
        String action,
        String resourceType,
        String resourceId,
        String oldValue,
        String newValue,
        String reason,
        String requestId,
        String ipAddress,
        Instant createdAt
) {
    public static AuditLogResponse from(AuditLog log) {
        if (log == null) return null;
        String action = log.getEventType() != null ? log.getEventType().name() : null;
        return new AuditLogResponse(
                log.getId(),
                log.getUserId(),
                action,
                extractResourceType(action),
                null,
                null,
                null,
                log.getMetadata(),
                log.getRequestId(),
                log.getIpAddress(),
                log.getCreatedAt()
        );
    }

    private static String extractResourceType(String action) {
        if (action == null) return "UNKNOWN";
        if (action.startsWith("STAFF_")) return "STAFF_ACCESS";
        if (action.startsWith("ROLE_")) return "ROLE_RBAC";
        if (action.startsWith("MERCHANT_")) return "MERCHANT";
        if (action.startsWith("STORE_")) return "STORE";
        if (action.startsWith("OFFER_")) return "OFFER";
        if (action.startsWith("USER_") || action.startsWith("ACCOUNT_")) return "USER";
        if (action.startsWith("TRANSACTION_")) return "TRANSACTION";
        if (action.startsWith("REDEMPTION_")) return "REDEMPTION";
        if (action.startsWith("REWARD_")) return "REWARD";
        if (action.startsWith("CATEGORY_")) return "CATEGORY";
        if (action.startsWith("CITY_")) return "CITY";
        return "SYSTEM";
    }
}
