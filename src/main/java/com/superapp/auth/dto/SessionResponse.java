package com.superapp.auth.dto;

import com.superapp.user.entity.UserSession;

import java.time.Instant;

/**
 * Session information safe to return to the authenticated user.
 */
public record SessionResponse(
        String id,
        String deviceId,
        String deviceName,
        String ipAddress,
        Instant createdAt,
        Instant lastActiveAt,
        Instant expiresAt,
        boolean active
) {
    public static SessionResponse from(UserSession session) {
        return new SessionResponse(
                session.getId().toString(),
                session.getDeviceId(),
                session.getDeviceName(),
                session.getIpAddress(),
                session.getCreatedAt(),
                session.getLastActiveAt(),
                session.getExpiresAt(),
                session.isActive()
        );
    }
}
