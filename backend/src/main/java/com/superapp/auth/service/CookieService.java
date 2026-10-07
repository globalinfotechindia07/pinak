package com.superapp.auth.service;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Enterprise Cookie and HMAC-bound Anti-CSRF Token Service.
 * Implements:
 * - Dual-channel cookie isolation (HttpOnly, Secure, SameSite=Lax, strictly scoped to /api/v1/auth)
 * - Cryptographic Double-Submit HMAC CSRF Token verification
 * - Dynamic HTTPS detection for local development vs production environments
 */
@Service
public class CookieService {

    private static final Logger log = LoggerFactory.getLogger(CookieService.class);

    public static final String REFRESH_COOKIE_NAME = "refresh_token";
    public static final String CSRF_COOKIE_NAME = "XSRF-TOKEN";
    public static final String CSRF_HEADER_NAME = "X-XSRF-TOKEN";
    public static final String CLIENT_TYPE_HEADER = "X-Client-Type";

    private final String hmacSecret;
    private final boolean forceSecureCookie;
    private final SecureRandom secureRandom = new SecureRandom();

    public CookieService(
            @Value("${jwt.secret}") String secret,
            @Value("${app.cookie.secure:false}") boolean forceSecureCookie
    ) {
        this.hmacSecret = secret;
        this.forceSecureCookie = forceSecureCookie;
    }

    /**
     * Attaches the HttpOnly refresh token cookie to the response.
     * Scoped strictly to /api/v1/auth so the browser never transmits it on static assets or unrelated APIs.
     */
    public void attachRefreshCookie(HttpServletRequest request, HttpServletResponse response, String rawRefreshToken, long maxAgeSeconds) {
        boolean isSecure = forceSecureCookie || request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));

        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, rawRefreshToken)
                .httpOnly(true)
                .secure(isSecure)
                .path("/api/v1/auth")
                .maxAge(maxAgeSeconds)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        log.debug("Attached HttpOnly refresh cookie (secure={}, maxAge={}s)", isSecure, maxAgeSeconds);
    }

    /**
     * Clears the refresh token cookie by setting Max-Age=0.
     */
    public void clearRefreshCookie(HttpServletRequest request, HttpServletResponse response) {
        boolean isSecure = forceSecureCookie || request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));

        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(isSecure)
                .path("/api/v1/auth")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        log.debug("Cleared refresh cookie");
    }

    /**
     * Generates a tamper-proof, HMAC-SHA256 signed CSRF token.
     * Format: <randomNonce>.<timestampSeconds>.<hmacSignature>
     */
    public String generateCsrfToken() {
        byte[] nonceBytes = new byte[16];
        secureRandom.nextBytes(nonceBytes);
        String nonce = Base64.getUrlEncoder().withoutPadding().encodeToString(nonceBytes);
        long timestamp = Instant.now().getEpochSecond();

        String payload = nonce + "." + timestamp;
        String signature = sign(payload);
        return payload + "." + signature;
    }

    /**
     * Attaches the client-readable CSRF cookie (HttpOnly=false so frontend JS can read and forward it).
     */
    public void attachCsrfCookie(HttpServletRequest request, HttpServletResponse response, String csrfToken) {
        boolean isSecure = forceSecureCookie || request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));

        ResponseCookie cookie = ResponseCookie.from(CSRF_COOKIE_NAME, csrfToken)
                .httpOnly(false)
                .secure(isSecure)
                .path("/")
                .maxAge(86400) // 24 hours
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Validates that the CSRF token has not been tampered with and has not expired (max 24h validity).
     */
    public boolean isValidCsrfToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return false;
        }

        String payload = parts[0] + "." + parts[1];
        String expectedSignature = sign(payload);

        if (!expectedSignature.equals(parts[2])) {
            log.warn("CSRF token signature verification failed");
            return false;
        }

        try {
            long issuedAt = Long.parseLong(parts[1]);
            long now = Instant.now().getEpochSecond();
            // Valid for up to 24 hours (86400s), clock skew allowance of 300s
            return (now - issuedAt) <= 86400 && (issuedAt - now) <= 300;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Extracts a named cookie value from the incoming request.
     */
    public String extractCookieValue(HttpServletRequest request, String cookieName) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    /**
     * Checks if the request is from a native mobile client.
     */
    public boolean isMobileClient(HttpServletRequest request) {
        String clientType = request.getHeader(CLIENT_TYPE_HEADER);
        return "mobile".equalsIgnoreCase(clientType);
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(rawHmac);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to calculate HMAC-SHA256 signature for CSRF", e);
        }
    }
}
