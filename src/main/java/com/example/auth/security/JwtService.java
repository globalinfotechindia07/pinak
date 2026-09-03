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
 * Supports both short-lived Access Tokens and long-lived Refresh Tokens.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String ISSUER = "auth-service";

    public static final String CLAIM_TOKEN_TYPE = "tokenType";
    public static final String TOKEN_TYPE_ACCESS = "ACCESS";
    public static final String TOKEN_TYPE_REFRESH = "REFRESH";

    private final String secretKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secretKey,
            @Value("${jwt.access-token-expiration:900000}") long accessTokenExpirationMs,
            @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenExpirationMs
    ) {
        this.secretKey = secretKey;
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    /**
     * Generates a signed short-lived JWT Access Token (default: 15 minutes).
     *
     * @param user the authenticated user entity
     * @return signed JWT string
     */
    public String generateAccessToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getEmail())
                .issuer(ISSUER)
                .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS)
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
     * Generates a signed long-lived JWT Refresh Token (default: 7 days).
     *
     * @param user the authenticated user entity
     * @return signed JWT refresh token string
     */
    public String generateRefreshToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getEmail())
                .issuer(ISSUER)
                .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_REFRESH)
                .claim("userId", user.getId().toString())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Backward-compatible alias for generating an access token.
     */
    public String generateToken(User user) {
        return generateAccessToken(user);
    }

    /**
     * Extracts the subject (email/username) from the JWT.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts the token type claim (ACCESS or REFRESH).
     */
    public String extractTokenType(String token) {
        Claims claims = extractAllClaims(token);
        return claims != null ? claims.get(CLAIM_TOKEN_TYPE, String.class) : null;
    }

    /**
     * Extracts the role claim from the JWT.
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
     * Validates if the token is a valid ACCESS token for the given UserDetails and has not expired.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        final String tokenType = extractTokenType(token);
        boolean isAccessType = tokenType == null || TOKEN_TYPE_ACCESS.equals(tokenType);
        return (username != null && username.equals(userDetails.getUsername()) && !isTokenExpired(token) && isAccessType);
    }

    /**
     * Validates if the token is a valid REFRESH token.
     */
    public boolean isRefreshTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        final String tokenType = extractTokenType(token);
        return (username != null && username.equals(userDetails.getUsername()) && !isTokenExpired(token) && TOKEN_TYPE_REFRESH.equals(tokenType));
    }

    /**
     * Validates if a token is a refresh token without userDetails lookup.
     */
    public boolean isRefreshToken(String token) {
        final String tokenType = extractTokenType(token);
        return TOKEN_TYPE_REFRESH.equals(tokenType) && !isTokenExpired(token);
    }

    /**
     * Checks if token has passed its expiration time.
     */
    public boolean isTokenExpired(String token) {
        Date expiration = extractExpiration(token);
        return expiration != null && expiration.before(new Date());
    }

    public long getAccessTokenExpirationInSeconds() {
        return accessTokenExpirationMs / 1000;
    }

    public long getRefreshTokenExpirationInSeconds() {
        return refreshTokenExpirationMs / 1000;
    }

    public long getExpirationInSeconds() {
        return getAccessTokenExpirationInSeconds();
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
