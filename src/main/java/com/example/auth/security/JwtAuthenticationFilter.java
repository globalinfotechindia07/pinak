package com.example.auth.security;

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

/**
 * Filter that intercepts incoming HTTP requests once per request, extracting and validating
 * the JWT Bearer token from the 'Authorization' header, and populating Spring's SecurityContext.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

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

        final String authHeader = request.getHeader("Authorization");

        // 1. Verify Authorization header format
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String userEmail = jwtService.extractUsername(jwt);

        // 2. If valid email found and user is not already authenticated in this thread context
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            log.debug("Authenticating request to '{}' for subject: {}", request.getRequestURI(), userEmail);
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // 3. Validate signature and expiration against user details
            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 4. Update SecurityContext so subsequent filters and controllers know the caller's identity
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.debug("Successfully authenticated user: {} with authorities: {}", userEmail, userDetails.getAuthorities());
            } else {
                log.warn("JWT token validation failed for user: {} on URI: {}", userEmail, request.getRequestURI());
            }
        }

        filterChain.doFilter(request, response);
    }
}
