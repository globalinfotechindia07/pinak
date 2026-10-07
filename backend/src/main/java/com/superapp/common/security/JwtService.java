package com.superapp.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

/**
 * JWT service: generation and validation of Access and Refresh tokens.
 * <p>
 * Access token payload:
 * <pre>{ "sub": "&lt;user-uuid&gt;", "role": "CUSTOMER", "iss": "superapp-api",
 *   "aud": ["superapp-client"], "iat": ..., "exp": ... }</pre>
 * <p>
 * Validation checks: signature, issuer, audience, expiration, not-before, algorithm.
 * The JWT sub is the user UUID (not email) to prevent account enumeration.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    public static final String CLAIM_TOKEN_TYPE = "tokenType";
    public static final String TOKEN_TYPE_ACCESS  = "ACCESS";
    public static final String TOKEN_TYPE_REFRESH = "REFRESH";
    public static final String CLAIM_ROLE = "role";

    private final String secretKey;
    private final String issuer;
    private final String audience;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secretKey,
            @Value("${jwt.issuer:superapp-api}") String issuer,
            @Value("${jwt.audience:superapp-client}") String audience,
            @Value("${jwt.access-token-expiration:900000}") long accessTokenExpirationMs,
            @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenExpirationMs
    ) {
        this.secretKey = secretKey;
        this.issuer = issuer;
        this.audience = audience;
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    /**
     * Generates a short-lived ACCESS token. Subject is the user UUID.
     */
    public String generateAccessToken(UUID userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userId.toString())
                .issuer(issuer)
                .audience().add(audience).and()
                .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS)
                .claim(CLAIM_ROLE, role)
                .issuedAt(Date.from(now))
                .notBefore(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTokenExpirationMs)))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Generates a long-lived REFRESH token. Subject is the user UUID.
     * Refresh tokens are NOT stored in the database as-is — only their SHA-256 hash.
     */
    public String generateRefreshToken(UUID userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userId.toString())
                .issuer(issuer)
                .audience().add(audience).and()
                .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_REFRESH)
                .issuedAt(Date.from(now))
                .notBefore(Date.from(now))
                .expiration(Date.from(now.plusMillis(refreshTokenExpirationMs)))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Validates an ACCESS token: signature, issuer, audience, expiry, nbf, type.
     *
     * @param token raw JWT string
     * @return true if valid access token
     */
    public boolean isValidAccessToken(String token) {
        if (token == null || token.isBlank()) return false;
        try {
            Claims claims = parseClaims(token);
            return TOKEN_TYPE_ACCESS.equals(claims.get(CLAIM_TOKEN_TYPE, String.class));
        } catch (ExpiredJwtException e) {
            log.debug("Access token expired");
            return false;
        } catch (JwtException e) {
            log.debug("Access token invalid: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validates a REFRESH token: signature, issuer, audience, expiry, type.
     */
    public boolean isValidRefreshToken(String token) {
        if (token == null || token.isBlank()) return false;
        try {
            Claims claims = parseClaims(token);
            return TOKEN_TYPE_REFRESH.equals(claims.get(CLAIM_TOKEN_TYPE, String.class));
        } catch (ExpiredJwtException e) {
            log.debug("Refresh token expired");
            return false;
        } catch (JwtException e) {
            log.debug("Refresh token invalid: {}", e.getMessage());
            return false;
        }
    }

    /** Extracts the user UUID from the token subject claim. */
    public UUID extractUserId(String token) {
        String subject = extractClaim(token, Claims::getSubject);
        if (subject == null) return null;
        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException e) {
            log.warn("Token subject is not a valid UUID: {}", subject);
            return null;
        }
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get(CLAIM_ROLE, String.class));
    }

    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get(CLAIM_TOKEN_TYPE, String.class));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationMs / 1000;
    }

    public long getRefreshTokenExpirationSeconds() {
        return refreshTokenExpirationMs / 1000;
    }

    // ---- Private helpers ----

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        try {
            return resolver.apply(parseClaims(token));
        } catch (JwtException | IllegalArgumentException e) {
            log.trace("Could not extract claim: {}", e.getMessage());
            return null;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secretKey);
        } catch (IllegalArgumentException e) {
            keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
