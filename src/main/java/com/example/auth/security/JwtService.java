package com.example.auth.security;

import com.example.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

/**
 * Service responsible for creating, signing, parsing, and validating JSON Web Tokens (JWT).
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String ISSUER = "auth-service";

    private final String secretKey;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secretKey,
            @Value("${jwt.expiration:900000}") long expirationMs
    ) {
        this.secretKey = secretKey;
        this.expirationMs = expirationMs;
    }

    /**
     * Generates a signed JWT access token for the given User entity.
     *
     * @param user the authenticated user entity
     * @return signed JWT string
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getEmail())
                .issuer(ISSUER)
                .claim("role", "ROLE_" + user.getRole().name())
                .claim("userId", user.getId().toString())
                .claim("firstName", user.getFirstName())
                .claim("lastName", user.getLastName())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extracts the subject (email/username) from the JWT.
     *
     * @param token JWT string
     * @return subject (email)
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts the role claim from the JWT.
     *
     * @param token JWT string
     * @return role string (e.g. ROLE_USER, ROLE_ADMIN)
     */
    public String extractRole(String token) {
        Claims claims = extractAllClaims(token);
        return claims != null ? claims.get("role", String.class) : null;
    }

    /**
     * Extracts expiration timestamp from the JWT.
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extracts a specific claim using a resolver function.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claims != null ? claimsResolver.apply(claims) : null;
    }

    /**
     * Validates if the token is valid for the given UserDetails and has not expired.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username != null && username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    /**
     * Checks if token has passed its expiration time.
     */
    public boolean isTokenExpired(String token) {
        Date expiration = extractExpiration(token);
        return expiration != null && expiration.before(new Date());
    }

    public long getExpirationInSeconds() {
        return expirationMs / 1000;
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return null;
        }
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
