package com.example.auth.security;

import com.example.auth.entity.Role;
import com.example.auth.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private final String testSecret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private final long testAccessExpirationMs = 900000; // 15 minutes
    private final long testRefreshExpirationMs = 604800000; // 7 days

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(testSecret, testAccessExpirationMs, testRefreshExpirationMs);
    }

    @Test
    @DisplayName("Should generate valid Access Token with correct claims and ACCESS tokenType")
    void shouldGenerateValidAccessToken() {
        User user = new User("john.doe@example.com", "hashedPassword", "John", "Doe", Role.USER);
        user.setId(UUID.randomUUID());

        String token = jwtService.generateAccessToken(user);

        assertNotNull(token);
        assertFalse(token.isBlank());
        assertEquals("john.doe@example.com", jwtService.extractUsername(token));
        assertEquals("ROLE_USER", jwtService.extractRole(token));
        assertEquals(JwtService.TOKEN_TYPE_ACCESS, jwtService.extractTokenType(token));
        assertFalse(jwtService.isTokenExpired(token));
        assertFalse(jwtService.isRefreshToken(token));
    }

    @Test
    @DisplayName("Should generate valid Refresh Token with REFRESH tokenType")
    void shouldGenerateValidRefreshToken() {
        User user = new User("refresh.user@example.com", "hashedPassword", "Refresh", "User", Role.USER);
        user.setId(UUID.randomUUID());

        String refreshToken = jwtService.generateRefreshToken(user);

        assertNotNull(refreshToken);
        assertFalse(refreshToken.isBlank());
        assertEquals("refresh.user@example.com", jwtService.extractUsername(refreshToken));
        assertEquals(JwtService.TOKEN_TYPE_REFRESH, jwtService.extractTokenType(refreshToken));
        assertTrue(jwtService.isRefreshToken(refreshToken));
        assertFalse(jwtService.isTokenExpired(refreshToken));
    }

    @Test
    @DisplayName("Should validate Access Token against matching UserDetails")
    void shouldValidateAccessTokenAgainstUserDetails() {
        User user = new User("alice@example.com", "hashedPassword", "Alice", "Smith", Role.ADMIN);
        user.setId(UUID.randomUUID());

        String token = jwtService.generateAccessToken(user);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                "alice@example.com",
                "hashedPassword",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        assertTrue(jwtService.isTokenValid(token, userDetails));
    }

    @Test
    @DisplayName("Should not allow Refresh Token to be validated as an Access Token")
    void shouldRejectRefreshTokenInAccessTokenValidation() {
        User user = new User("alice@example.com", "hashedPassword", "Alice", "Smith", Role.USER);
        user.setId(UUID.randomUUID());

        String refreshToken = jwtService.generateRefreshToken(user);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                "alice@example.com",
                "hashedPassword",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );

        // Access token validator must reject a refresh token
        assertFalse(jwtService.isTokenValid(refreshToken, userDetails));
    }

    @Test
    @DisplayName("Should reject token for non-matching UserDetails")
    void shouldRejectTokenForNonMatchingUserDetails() {
        User user = new User("alice@example.com", "hashedPassword", "Alice", "Smith", Role.USER);
        user.setId(UUID.randomUUID());

        String token = jwtService.generateAccessToken(user);

        UserDetails differentUser = new org.springframework.security.core.userdetails.User(
                "bob@example.com",
                "hashedPassword",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );

        assertFalse(jwtService.isTokenValid(token, differentUser));
    }

    @Test
    @DisplayName("Should detect expired tokens")
    void shouldDetectExpiredToken() {
        // Create a JwtService with negative expiration time (-1000ms) to simulate expired token
        JwtService expiredJwtService = new JwtService(testSecret, -1000, -1000);

        User user = new User("expired@example.com", "hashedPassword", "Expired", "User", Role.USER);
        user.setId(UUID.randomUUID());

        String expiredToken = expiredJwtService.generateAccessToken(user);

        assertFalse(jwtService.isTokenValid(expiredToken, new org.springframework.security.core.userdetails.User(
                "expired@example.com", "pwd", Collections.emptyList()
        )));
    }
}
