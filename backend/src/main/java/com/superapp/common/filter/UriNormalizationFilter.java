package com.superapp.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Normalizes multi-slash paths (e.g., //api/v1/... caused by baseUrl ending with slash in Postman/clients)
 * so Spring Security matchers evaluate cleanly.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class UriNormalizationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String uri = request.getRequestURI();
        if (uri != null && uri.contains("//")) {
            HttpServletRequestWrapper wrapper = new HttpServletRequestWrapper(request) {
                @Override
                public String getRequestURI() {
                    return super.getRequestURI().replaceAll("/+", "/");
                }

                @Override
                public String getServletPath() {
                    return super.getServletPath().replaceAll("/+", "/");
                }
            };
            filterChain.doFilter(wrapper, response);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
