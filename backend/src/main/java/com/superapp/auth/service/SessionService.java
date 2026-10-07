package com.superapp.auth.service;

import com.superapp.auth.dto.SessionDTO;
import com.superapp.auth.repository.UserSessionRepository;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Manages user device sessions: creation, listing, and revocation.
 */
@Service
public class SessionService {

    private static final Logger log = LoggerFactory.getLogger(SessionService.class);

    private final UserSessionRepository sessionRepository;
    private final TokenService tokenService;
    private final long sessionExpiryDays;

    public SessionService(
            UserSessionRepository sessionRepository,
            TokenService tokenService,
            @Value("${app.session.expiry-days:7}") long sessionExpiryDays
    ) {
        this.sessionRepository = sessionRepository;
        this.tokenService = tokenService;
        this.sessionExpiryDays = sessionExpiryDays;
    }

    /**
     * Creates a new session for a user login.
     */
    @Transactional
    public UserSession createSession(User user, String deviceId, String deviceName,
                                     String ipAddress, String userAgent) {
        UserSession session = new UserSession();
        session.setUser(user);
        session.setDeviceId(deviceId);
        session.setDeviceName(deviceName);
        session.setIpAddress(ipAddress);
        session.setUserAgent(userAgent);
        session.setExpiresAt(Instant.now().plusSeconds(sessionExpiryDays * 24 * 60 * 60));

        UserSession saved = sessionRepository.save(session);
        log.debug("Created session {} for user={} device='{}'", saved.getId(), user.getId(), deviceName);
        return saved;
    }

    /**
     * Returns all active sessions for a user (safe for client display).
     */
    @Transactional(readOnly = true)
    public List<SessionDTO.Response> getActiveSessions(User user) {
        return sessionRepository.findActiveSessions(user, Instant.now())
                .stream()
                .map(SessionDTO.Response::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SessionDTO.Response> getActiveSessions(UUID userId) {
        return sessionRepository.findActiveSessionsByUserId(userId, Instant.now())
                .stream()
                .map(SessionDTO.Response::from)
                .toList();
    }

    /**
     * Revokes a specific session belonging to the user.
     * Also revokes all associated refresh tokens.
     */
    @Transactional
    public void revokeSession(User user, UUID sessionId) {
        UserSession session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> ResourceNotFoundException.session(sessionId.toString()));

        if (session.getRevokedAt() != null) {
            log.debug("Session {} already revoked", sessionId);
            return;
        }

        session.setRevokedAt(Instant.now());
        sessionRepository.save(session);

        tokenService.revokeBySession(sessionId);
        log.info("Revoked session={} for user={}", sessionId, user.getId());
    }

    @Transactional
    public void revokeSessionForUser(UUID userId, UUID sessionId) {
        UserSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> ResourceNotFoundException.session(sessionId.toString()));

        if (!session.getUser().getId().equals(userId)) {
            throw new com.superapp.common.exception.ForbiddenException("You do not have permission to revoke this session");
        }

        if (session.getRevokedAt() != null) {
            log.debug("Session {} already revoked", sessionId);
            return;
        }

        session.setRevokedAt(Instant.now());
        sessionRepository.save(session);

        tokenService.revokeBySession(sessionId);
        log.info("Revoked session={} for user={}", sessionId, userId);
    }

    /**
     * Revokes all sessions and all refresh tokens for a user (logout-all / security reset).
     */
    @Transactional
    public void revokeAllSessions(User user) {
        int sessionCount = sessionRepository.revokeAllForUser(user, Instant.now());
        tokenService.revokeAllForUser(user);
        log.info("Revoked {} session(s) for user={} (logout-all)", sessionCount, user.getId());
    }
}
