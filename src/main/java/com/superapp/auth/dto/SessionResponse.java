package com.superapp.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.superapp.user.entity.UserSession;

import java.time.Instant;

/**
 * Session information safe to return to the authenticated user.
 * Never leaks refresh token, token hashes, or secrets.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SessionResponse(
        String id,
        String deviceId,
        String deviceName,
        String ipAddress,
        Instant createdAt,
        @JsonProperty("lastUsedAt")
        Instant lastActiveAt,
        Instant expiresAt,
        boolean active,
        Boolean current
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
                session.isActive(),
                Boolean.TRUE
        );
    }

    public static SessionResponse from(UserSession session, boolean isCurrent) {
        return new SessionResponse(
                session.getId().toString(),
                session.getDeviceId(),
                session.getDeviceName(),
                session.getIpAddress(),
                session.getCreatedAt(),
                session.getLastActiveAt(),
                session.getExpiresAt(),
                session.isActive(),
                isCurrent
        );
    }

    // 8-arg constructor for backward compatibility
    public SessionResponse(String id, String deviceId, String deviceName, String ipAddress,
                           Instant createdAt, Instant lastActiveAt, Instant expiresAt, boolean active) {
        this(id, deviceId, deviceName, ipAddress, createdAt, lastActiveAt, expiresAt, active, Boolean.TRUE);
    }
}
