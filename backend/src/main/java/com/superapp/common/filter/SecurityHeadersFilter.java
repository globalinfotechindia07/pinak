package com.superapp.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Adds security-hardening HTTP headers to every response.
 * <p>
 * Note on CSRF: This API uses Bearer token authentication (Authorization header),
 * not cookies. Therefore CSRF protection is not required for these endpoints.
 * If HttpOnly cookies are introduced for token transport in the future,
 * implement SameSite=Strict cookies and/or Double Submit Cookie CSRF defense.
 */
@Component
@Order(2)
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String uri = request.getRequestURI();
        boolean isSwagger = uri != null && (uri.startsWith("/swagger-ui") || uri.startsWith("/v3/api-docs"));

        // Enforce HTTPS in production (Nginx handles TLS termination and sets this)
        response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

        // Prevent MIME-type sniffing
        response.setHeader("X-Content-Type-Options", "nosniff");

        // Prevent clickjacking
        response.setHeader("X-Frame-Options", "DENY");

        // Control referrer information
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // CSP: Swagger UI requires loading its bundled JS, CSS, fonts, and favicon
        if (isSwagger) {
            response.setHeader("Content-Security-Policy",
                    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'");
        } else {
            // API-only, no HTML served — restrict everything
            response.setHeader("Content-Security-Policy", "default-src 'none'");

            // Prevent caching of API responses (important for auth endpoints)
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            response.setHeader("Pragma", "no-cache");
        }

        filterChain.doFilter(request, response);
    }
}
