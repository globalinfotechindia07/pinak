package com.superapp.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS configuration.
 * <p>
 * Access-Control-Allow-Origin: * is NEVER used for authenticated APIs.
 * Only explicitly allowlisted origins and cloud patterns are permitted.
 */
@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOriginsRaw;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Parse comma-separated origins from config
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
        config.addAllowedOriginPattern("https://*.onrender.com");
        config.addAllowedOriginPattern("https://*.vercel.app");
        config.addAllowedOriginPattern("https://*.netlify.app");

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(
                "Authorization", "Content-Type", "X-Request-ID", "X-Requested-With", "Accept",
                "X-XSRF-TOKEN", "X-CSRF-Token", "X-Client-Type", "X-Device-Fingerprint", "X-Device-Platform"));
        config.setExposedHeaders(List.of("X-Request-ID", "Set-Cookie"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // Pre-flight cache: 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
