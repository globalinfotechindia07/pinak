package com.superapp.auth.service;

import com.superapp.auth.repository.RefreshTokenRepository;
import com.superapp.common.exception.AuthException;
import com.superapp.common.security.JwtService;
import com.superapp.user.entity.RefreshToken;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Manages refresh token lifecycle in the database:
 * - Issue (store hashed token)
 * - Rotate (revoke old, issue new, same family)
 * - Reuse detection (revoke entire family on reuse)
 * - Revoke by session or by user
 */
@Service
public class TokenService {

    private static final Logger log = LoggerFactory.getLogger(TokenService.class);

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final long refreshTokenExpirationMs;

    public TokenService(
            RefreshTokenRepository refreshTokenRepository,
            JwtService jwtService,
            @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenExpirationMs
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    /**
     * Issues a new refresh token for a user/session. Creates a new token family.
     *
     * @param user    the user
     * @param session the associated device session
     * @return the raw refresh token string (store this in the response; hash is stored in DB)
     */
    @Transactional
    public String issueRefreshToken(User user, UserSession session) {
        String rawToken = jwtService.generateRefreshToken(user.getId());
        String hash = hashToken(rawToken);
        UUID familyId = UUID.randomUUID(); // New family for new login

        RefreshToken entity = new RefreshToken();
        entity.setUser(user);
        entity.setSession(session);
        entity.setTokenHash(hash);
        entity.setFamilyId(familyId);
        entity.setExpiresAt(Instant.now().plusMillis(refreshTokenExpirationMs));

        refreshTokenRepository.save(entity);
        log.debug("Issued refresh token for user={} family={}", user.getId(), familyId);
        return rawToken;
    }

    /**
     * Rotates a refresh token: validates the presented token, issues a new one, revokes the old one.
     * Detects reuse and revokes the entire family if a revoked token is presented.
     *
     * @param rawRefreshToken the raw token from the client
     * @return new raw refresh token string
     * @throws AuthException on invalid, expired, or reused token
     */
    @Transactional
    public RotationResult rotateRefreshToken(String rawRefreshToken) {
        // 1. Validate JWT structure first
        if (!jwtService.isValidRefreshToken(rawRefreshToken)) {
            throw AuthException.refreshTokenInvalid();
        }

        UUID userId = jwtService.extractUserId(rawRefreshToken);
        if (userId == null) {
            throw AuthException.refreshTokenInvalid();
        }

        // 2. Find token in DB by hash
        String hash = hashToken(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(AuthException::refreshTokenInvalid);

        // 3. Check if already revoked (reuse detection)
        if (stored.isRevoked()) {
            log.warn("SECURITY ALERT: Refresh token reuse detected! Revoking family={} user={}",
                    stored.getFamilyId(), userId);
            revokeFamily(stored.getFamilyId());
            throw AuthException.tokenReuseDetected();
        }

        // 4. Revoke the current token
        stored.setRevokedAt(Instant.now());
        refreshTokenRepository.save(stored);

        // 5. Issue new token in the same family
        String newRawToken = jwtService.generateRefreshToken(userId);
        String newHash = hashToken(newRawToken);

        RefreshToken newToken = new RefreshToken();
        newToken.setUser(stored.getUser());
        newToken.setSession(stored.getSession());
        newToken.setTokenHash(newHash);
        newToken.setFamilyId(stored.getFamilyId()); // Same family
        newToken.setExpiresAt(Instant.now().plusMillis(refreshTokenExpirationMs));
        refreshTokenRepository.save(newToken);

        log.debug("Rotated refresh token for user={} family={}", userId, stored.getFamilyId());
        return new RotationResult(stored.getUser(), newRawToken);
    }

    /**
     * Revokes all active refresh tokens for a session (logout single device).
     */
    @Transactional
    public void revokeBySession(UUID sessionId) {
        int count = refreshTokenRepository.revokeBySessionId(sessionId, Instant.now());
        log.debug("Revoked {} refresh token(s) for session={}", count, sessionId);
    }

    /**
     * Revokes all active refresh tokens for a user (logout-all).
     */
    @Transactional
    public void revokeAllForUser(User user) {
        int count = refreshTokenRepository.revokeAllForUser(user, Instant.now());
        log.debug("Revoked {} refresh token(s) for user={}", count, user.getId());
    }

    private void revokeFamily(UUID familyId) {
        int count = refreshTokenRepository.revokeFamily(familyId, Instant.now());
        log.warn("Revoked {} token(s) in family={} due to reuse detection", count, familyId);
    }

    /**
     * Computes SHA-256 hash of the raw token.
     * Only the hash is stored in the database.
     */
    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    /** Result record from token rotation. */
    public record RotationResult(User user, String newRawRefreshToken) {}
}
