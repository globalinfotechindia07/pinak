package com.superapp.common.config;

import com.superapp.common.security.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.common.response.ApiError;
import com.superapp.common.response.ApiResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.nio.charset.StandardCharsets;

/**
 * Spring Security configuration.
 * <ul>
 *   <li>Stateless JWT — no HTTP sessions.</li>
 *   <li>CSRF disabled — Bearer token transport (see SecurityHeadersFilter for CSRF strategy note).</li>
 *   <li>CORS handled by CorsConfig bean.</li>
 *   <li>@PreAuthorize used for fine-grained authorization — @EnableMethodSecurity activated.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, ObjectMapper objectMapper) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF — API uses Bearer tokens, not cookies (see SecurityHeadersFilter for policy)
            .csrf(AbstractHttpConfigurer::disable)

            // CORS handled by CorsConfig
            .cors(cors -> {})

            // Stateless — no HTTP sessions
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                // Public auth endpoints
                .requestMatchers(HttpMethod.POST,
                        "/api/v1/auth/register",
                        "/api/v1/auth/login",
                        "/api/v1/auth/otp/**",
                        "/api/v1/auth/refresh",
                        "/api/v1/auth/token/refresh",
                        "/api/v1/auth/forgot-password",
                        "/api/v1/auth/verify-reset-otp",
                        "/api/v1/auth/reset-password",
                        "/api/v1/admin/auth/**"
                ).permitAll()

                // Public payment webhook
                .requestMatchers(HttpMethod.POST, "/api/v1/payments/webhook").permitAll()

                // Public categories lookup and public discovery endpoints
                .requestMatchers(HttpMethod.GET, "/api/v1/categories/**", "/api/v1/discovery/**").permitAll()

                // Health check
                .requestMatchers(HttpMethod.GET, "/api/v1/health").permitAll()

                // Swagger / OpenAPI (disable in production if needed via property)
                .requestMatchers(
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html"
                ).permitAll()

                // Role-based access control
                .requestMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/v1/merchant/**").hasAnyRole("MERCHANT", "VENDOR", "ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/v1/customer/**").hasAnyRole("CUSTOMER", "ADMIN", "SUPER_ADMIN")

                // All other endpoints require authentication
                .anyRequest().authenticated()
            )

            // Custom 401 response — no redirect to login page
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                    ApiResponse<?> body = ApiResponse.error("Authentication required", ApiError.UNAUTHORIZED.name());
                    response.getWriter().write(objectMapper.writeValueAsString(body));
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                    ApiResponse<?> body = ApiResponse.error(
                            "You do not have permission to perform this action", ApiError.FORBIDDEN.name());
                    response.getWriter().write(objectMapper.writeValueAsString(body));
                })
            )

            // Add JWT filter before Spring's username/password filter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt with strength 12 for production-grade security
        return new BCryptPasswordEncoder(12);
    }
}
