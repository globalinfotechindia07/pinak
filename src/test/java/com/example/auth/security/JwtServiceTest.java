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
    private final long testExpirationMs = 900000; // 15 minutes

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(testSecret, testExpirationMs);
    }

    @Test
    @DisplayName("Should generate valid JWT token with correct claims")
    void shouldGenerateValidToken() {
        User user = new User("john.doe@example.com", "hashedPassword", "John", "Doe", Role.USER);
        user.setId(UUID.randomUUID());

        String token = jwtService.generateToken(user);

        assertNotNull(token);
        assertFalse(token.isBlank());
        assertEquals("john.doe@example.com", jwtService.extractUsername(token));
        assertEquals("ROLE_USER", jwtService.extractRole(token));
        assertFalse(jwtService.isTokenExpired(token));
    }

    @Test
    @DisplayName("Should validate token against matching UserDetails")
    void shouldValidateTokenAgainstUserDetails() {
        User user = new User("alice@example.com", "hashedPassword", "Alice", "Smith", Role.ADMIN);
        user.setId(UUID.randomUUID());

        String token = jwtService.generateToken(user);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                "alice@example.com",
                "hashedPassword",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        assertTrue(jwtService.isTokenValid(token, userDetails));
    }

    @Test
    @DisplayName("Should reject token for non-matching UserDetails")
    void shouldRejectTokenForNonMatchingUserDetails() {
        User user = new User("alice@example.com", "hashedPassword", "Alice", "Smith", Role.USER);
        user.setId(UUID.randomUUID());

        String token = jwtService.generateToken(user);

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
        JwtService expiredJwtService = new JwtService(testSecret, -1000);

        User user = new User("expired@example.com", "hashedPassword", "Expired", "User", Role.USER);
        user.setId(UUID.randomUUID());

        String expiredToken = expiredJwtService.generateToken(user);

        // jjws parser treats expired tokens as expired or throws JwtException
        assertFalse(jwtService.isTokenValid(expiredToken, new org.springframework.security.core.userdetails.User(
                "expired@example.com", "pwd", Collections.emptyList()
        )));
    }
}
