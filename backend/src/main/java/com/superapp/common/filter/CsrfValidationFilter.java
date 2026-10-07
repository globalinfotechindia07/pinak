package com.superapp.common.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.auth.service.CookieService;
import com.superapp.common.response.ApiError;
import com.superapp.common.response.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Enterprise Double-Submit HMAC CSRF Filter.
 * <p>
 * Defense Strategy:
 * 1. Mobile clients (X-Client-Type: mobile) bypass CSRF because native apps do not use ambient browser cookies.
 * 2. Web clients using HttpOnly cookies for session/token rotation MUST supply a matching X-XSRF-TOKEN header.
 * 3. Safe HTTP methods (GET, HEAD, OPTIONS, TRACE) are exempt as per RFC 7231.
 */
@Component
@Order(3)
public class CsrfValidationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(CsrfValidationFilter.class);

    private static final Set<String> PROTECTED_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    private static final Set<String> COOKIE_PROTECTED_PATHS = Set.of(
            "/api/v1/auth/refresh",
            "/api/v1/auth/token/refresh",
            "/api/v1/auth/logout",
            "/api/v1/auth/logout-all"
    );

    private final CookieService cookieService;
    private final ObjectMapper objectMapper;

    public CsrfValidationFilter(CookieService cookieService, ObjectMapper objectMapper) {
        this.cookieService = cookieService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod().toUpperCase();

        // 1. Skip non-mutating safe HTTP methods
        if (!PROTECTED_METHODS.contains(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Mobile clients bypass CSRF check safely (native apps are not vulnerable to browser CSRF)
        if (cookieService.isMobileClient(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. For cookie-protected auth endpoints (refresh, logout):
        // If a refresh_token cookie is present, enforce strict Double-Submit HMAC CSRF validation
        boolean hasRefreshCookie = cookieService.extractCookieValue(request, CookieService.REFRESH_COOKIE_NAME) != null;
        boolean isProtectedPath = COOKIE_PROTECTED_PATHS.stream().anyMatch(path::startsWith);

        if (hasRefreshCookie && isProtectedPath) {
            String headerCsrf = request.getHeader(CookieService.CSRF_HEADER_NAME);
            String cookieCsrf = cookieService.extractCookieValue(request, CookieService.CSRF_COOKIE_NAME);

            if (headerCsrf == null || headerCsrf.isBlank() || cookieCsrf == null || !headerCsrf.equals(cookieCsrf) || !cookieService.isValidCsrfToken(headerCsrf)) {
                log.warn("CSRF validation rejected on path={} from IP={}", path, request.getRemoteAddr());

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                ApiResponse<Void> errorResponse = ApiResponse.error("CSRF token missing, expired, or invalid. Please refresh the page.", ApiError.FORBIDDEN.name());
                response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
