package com.superapp.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Intercepts every request and validates the Bearer JWT in the Authorization header.
 * <p>
 * On a valid ACCESS token: sets the authenticated user in the SecurityContext.
 * On missing / invalid / refresh token: leaves SecurityContext empty (Spring Security handles 401).
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Skip pre-flight OPTIONS immediately so CORS filter handles it
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(BEARER_PREFIX.length());

        // Only process ACCESS tokens here (refresh tokens go through /auth/refresh endpoint only)
        if (!jwtService.isValidAccessToken(token)) {
            log.debug("Invalid or non-access JWT token for request: {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String userEmail = jwtService.extractUsername(token);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    // Extract and forward tenant/merchant context if present in claims
                    UUID merchantId = jwtService.extractMerchantId(token);
                    if (merchantId != null) {
                        request.setAttribute("merchantId", merchantId);
                    }
                    UUID storeId = jwtService.extractStoreId(token);
                    if (storeId != null) {
                        request.setAttribute("storeId", storeId);
                    }
                }
            }
        } catch (Exception ex) {
            // Log at debug level only — do not leak token parsing errors to clients
            log.debug("Failed to set user authentication from JWT: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
