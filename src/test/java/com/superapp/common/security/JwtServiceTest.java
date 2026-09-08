package com.superapp.common.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for JwtService: access token and refresh token generation,
 * validation (signature, expiry, issuer, audience, type enforcement).
 */
class JwtServiceTest {

    private static final String SECRET = "6A576E5A7234753778214125442A472D4B6150645367566B5970337336763979";
    private static final String ISSUER = "superapp-api";
    private static final String AUDIENCE = "superapp-client";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, ISSUER, AUDIENCE, 900_000L, 604_800_000L);
    }

    @Nested
    @DisplayName("Access Token")
    class AccessTokenTests {

        @Test
        @DisplayName("Valid access token is accepted")
        void validAccessToken() {
            UUID userId = UUID.randomUUID();
            String token = jwtService.generateAccessToken(userId, "CUSTOMER");

            assertThat(jwtService.isValidAccessToken(token)).isTrue();
            assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
            assertThat(jwtService.extractRole(token)).isEqualTo("CUSTOMER");
            assertThat(jwtService.extractTokenType(token)).isEqualTo(JwtService.TOKEN_TYPE_ACCESS);
        }

        @Test
        @DisplayName("Expired access token is rejected")
        void expiredAccessToken() {
            JwtService shortLived = new JwtService(SECRET, ISSUER, AUDIENCE, -1L, 604_800_000L);
            UUID userId = UUID.randomUUID();
            String token = shortLived.generateAccessToken(userId, "CUSTOMER");

            assertThat(shortLived.isValidAccessToken(token)).isFalse();
        }

        @Test
        @DisplayName("Tampered access token is rejected")
        void tamperedAccessToken() {
            UUID userId = UUID.randomUUID();
            String token = jwtService.generateAccessToken(userId, "CUSTOMER");
            String tampered = token.substring(0, token.length() - 10) + "TAMPERED99";

            assertThat(jwtService.isValidAccessToken(tampered)).isFalse();
        }

        @Test
        @DisplayName("Wrong issuer is rejected")
        void wrongIssuer() {
            JwtService wrongIssuer = new JwtService(SECRET, "wrong-issuer", AUDIENCE, 900_000L, 604_800_000L);
            UUID userId = UUID.randomUUID();
            String token = wrongIssuer.generateAccessToken(userId, "CUSTOMER");

            // Our jwtService expects "superapp-api" issuer
            assertThat(jwtService.isValidAccessToken(token)).isFalse();
        }

        @Test
        @DisplayName("Refresh token is rejected on access token validation")
        void refreshTokenRejectedAsAccessToken() {
            UUID userId = UUID.randomUUID();
            String refreshToken = jwtService.generateRefreshToken(userId);

            assertThat(jwtService.isValidAccessToken(refreshToken)).isFalse();
        }

        @Test
        @DisplayName("Subject (UUID) is correctly embedded")
        void subjectIsUuid() {
            UUID userId = UUID.randomUUID();
            String token = jwtService.generateAccessToken(userId, "SUPER_ADMIN");
            assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
        }

        @Test
        @DisplayName("Blank string token is rejected")
        void blankTokenRejected() {
            assertThat(jwtService.isValidAccessToken("")).isFalse();
            assertThat(jwtService.isValidAccessToken("not.a.jwt")).isFalse();
        }
    }

    @Nested
    @DisplayName("Refresh Token")
    class RefreshTokenTests {

        @Test
        @DisplayName("Valid refresh token is accepted")
        void validRefreshToken() {
            UUID userId = UUID.randomUUID();
            String token = jwtService.generateRefreshToken(userId);

            assertThat(jwtService.isValidRefreshToken(token)).isTrue();
            assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
            assertThat(jwtService.extractTokenType(token)).isEqualTo(JwtService.TOKEN_TYPE_REFRESH);
        }

        @Test
        @DisplayName("Expired refresh token is rejected")
        void expiredRefreshToken() {
            JwtService shortLived = new JwtService(SECRET, ISSUER, AUDIENCE, 900_000L, -1L);
            UUID userId = UUID.randomUUID();
            String token = shortLived.generateRefreshToken(userId);

            assertThat(shortLived.isValidRefreshToken(token)).isFalse();
        }

        @Test
        @DisplayName("Access token is rejected on refresh token validation")
        void accessTokenRejectedAsRefreshToken() {
            UUID userId = UUID.randomUUID();
            String accessToken = jwtService.generateAccessToken(userId, "CUSTOMER");

            assertThat(jwtService.isValidRefreshToken(accessToken)).isFalse();
        }

        @Test
        @DisplayName("Tampered refresh token is rejected")
        void tamperedRefreshToken() {
            UUID userId = UUID.randomUUID();
            String token = jwtService.generateRefreshToken(userId);
            String tampered = token.substring(0, token.length() - 5) + "XXXXX";

            assertThat(jwtService.isValidRefreshToken(tampered)).isFalse();
        }
    }
}
