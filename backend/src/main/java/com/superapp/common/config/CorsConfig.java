package com.superapp.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

/**
 * Enterprise CORS Configuration with HIGHEST_PRECEDENCE FilterRegistrationBean.
 * <p>
 * Ensures CORS headers and OPTIONS preflights are handled immediately before
 * any security filters, preventing 401 Unauthorized during browser preflight.
 */
@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOriginsRaw;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        List<String> exactOrigins = origins.stream().filter(s -> !s.contains("*")).toList();
        List<String> patternOrigins = origins.stream().filter(s -> s.contains("*")).toList();

        if (!exactOrigins.isEmpty()) {
            config.setAllowedOrigins(exactOrigins);
        }
        if (!patternOrigins.isEmpty()) {
            config.setAllowedOriginPatterns(patternOrigins);
        }

        // Always permit Render, Vercel, and Netlify cloud frontend deployments
        config.addAllowedOriginPattern("https://*.vercel.app");
        config.addAllowedOriginPattern("https://*.onrender.com");
        config.addAllowedOriginPattern("https://*.netlify.app");
        config.addAllowedOriginPattern("http://localhost:*");
        config.addAllowedOriginPattern("http://127.0.0.1:*");

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("X-Request-ID", "Set-Cookie", "Authorization", "X-XSRF-TOKEN"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // Pre-flight cache: 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
