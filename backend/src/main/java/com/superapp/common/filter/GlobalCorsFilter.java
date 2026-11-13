package com.superapp.common.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Universal Global CORS Filter with HIGHEST_PRECEDENCE.
 * <p>
 * Executes at the very front of the servlet container filter chain before
 * Spring Security, ensuring that all cross-origin requests (including Vercel,
 * Render, and localhost) receive valid Access-Control-Allow-* headers, and all
 * pre-flight OPTIONS requests receive an immediate 200 OK response.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalCorsFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD");
            response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID, X-Requested-With, Accept, X-XSRF-TOKEN, X-CSRF-Token, X-Client-Type, X-Device-Fingerprint, X-Device-Platform, Idempotency-Key, *");
            response.setHeader("Access-Control-Expose-Headers", "X-Request-ID, Set-Cookie, Authorization, X-XSRF-TOKEN");
            response.setHeader("Access-Control-Max-Age", "3600");
        }

        // Immediately respond 200 OK to all preflight OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(req, res);
    }
}
