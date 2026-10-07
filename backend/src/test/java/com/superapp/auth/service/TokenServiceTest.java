package com.superapp.auth.service;

import com.superapp.auth.repository.RefreshTokenRepository;
import com.superapp.common.exception.AuthException;
import com.superapp.common.security.JwtService;
import com.superapp.user.entity.RefreshToken;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserSession;
import com.superapp.user.entity.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenServiceTest {

    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock JwtService jwtService;

    private TokenService tokenService;

    private User user;

    @BeforeEach
    void setUp() {
        tokenService = new TokenService(refreshTokenRepository, jwtService, 604_800_000L);
        user = new User("test@example.com", "Test User", "Test", "User", "hashedpass", Role.CUSTOMER);
        user.setId(UUID.randomUUID());
        user.setStatus(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("issueRefreshToken stores hashed token and returns raw token")
    void issueRefreshToken_storesHash() {
        UserSession session = new UserSession();
        session.setId(UUID.randomUUID());

        when(jwtService.generateRefreshToken(any(UUID.class))).thenReturn("raw-refresh-token");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        String rawToken = tokenService.issueRefreshToken(user, session);

        assertThat(rawToken).isEqualTo("raw-refresh-token");

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());

        RefreshToken saved = captor.getValue();
        // Hash must NOT be the raw token
        assertThat(saved.getTokenHash()).isNotEqualTo("raw-refresh-token");
        assertThat(saved.getTokenHash()).hasSize(64); // SHA-256 hex = 64 chars
        assertThat(saved.getFamilyId()).isNotNull();
    }

    @Test
    @DisplayName("rotateRefreshToken: valid token results in new token, old is revoked")
    void rotateRefreshToken_success() {
        String oldRawToken = "old-refresh-token";
        String oldHash = tokenService.hashToken(oldRawToken);
        String newRawToken = "new-refresh-token";

        RefreshToken stored = new RefreshToken();
        stored.setId(UUID.randomUUID());
        stored.setUser(user);
        stored.setTokenHash(oldHash);
        stored.setFamilyId(UUID.randomUUID());
        stored.setExpiresAt(Instant.now().plusSeconds(3600));
        // Not revoked

        when(jwtService.isValidRefreshToken(oldRawToken)).thenReturn(true);
        when(jwtService.extractUserId(oldRawToken)).thenReturn(user.getId());
        when(refreshTokenRepository.findByTokenHash(oldHash)).thenReturn(Optional.of(stored));
        when(jwtService.generateRefreshToken(user.getId())).thenReturn(newRawToken);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        TokenService.RotationResult result = tokenService.rotateRefreshToken(oldRawToken);

        assertThat(result.newRawRefreshToken()).isEqualTo(newRawToken);
        assertThat(stored.getRevokedAt()).isNotNull(); // Old token revoked
    }

    @Test
    @DisplayName("Refresh token reuse detection: revokes entire family")
    void rotateRefreshToken_reuseDetected_revokesFamily() {
        String revokedRawToken = "revoked-token";
        String revokedHash = tokenService.hashToken(revokedRawToken);
        UUID familyId = UUID.randomUUID();

        RefreshToken stored = new RefreshToken();
        stored.setId(UUID.randomUUID());
        stored.setUser(user);
        stored.setTokenHash(revokedHash);
        stored.setFamilyId(familyId);
        stored.setExpiresAt(Instant.now().plusSeconds(3600));
        stored.setRevokedAt(Instant.now().minusSeconds(60)); // Already revoked!

        when(jwtService.isValidRefreshToken(revokedRawToken)).thenReturn(true);
        when(jwtService.extractUserId(revokedRawToken)).thenReturn(user.getId());
        when(refreshTokenRepository.findByTokenHash(revokedHash)).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> tokenService.rotateRefreshToken(revokedRawToken))
                .isInstanceOf(AuthException.class)
                .satisfies(e -> assertThat(((AuthException) e).getErrorCode().name())
                        .isEqualTo("TOKEN_REUSE_DETECTED"));

        // Family must be revoked
        verify(refreshTokenRepository).revokeFamily(eq(familyId), any(Instant.class));
    }

    @Test
    @DisplayName("Invalid JWT refresh token throws AuthException")
    void rotateRefreshToken_invalidJwt() {
        when(jwtService.isValidRefreshToken("bad-token")).thenReturn(false);

        assertThatThrownBy(() -> tokenService.rotateRefreshToken("bad-token"))
                .isInstanceOf(AuthException.class)
                .satisfies(e -> assertThat(((AuthException) e).getErrorCode().name())
                        .isEqualTo("REFRESH_TOKEN_INVALID"));
    }

    @Test
    @DisplayName("Token not found in DB throws AuthException")
    void rotateRefreshToken_notInDb() {
        String rawToken = "valid-jwt-not-in-db";

        when(jwtService.isValidRefreshToken(rawToken)).thenReturn(true);
        when(jwtService.extractUserId(rawToken)).thenReturn(user.getId());
        when(refreshTokenRepository.findByTokenHash(tokenService.hashToken(rawToken)))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> tokenService.rotateRefreshToken(rawToken))
                .isInstanceOf(AuthException.class);
    }
}
