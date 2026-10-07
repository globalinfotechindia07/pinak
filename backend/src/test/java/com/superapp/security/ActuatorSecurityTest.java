package com.superapp.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.common.config.CorsConfig;
import com.superapp.common.config.RedisConfig;
import com.superapp.common.config.SecurityConfig;
import com.superapp.common.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActuatorSecurityTest {

    @Mock
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Mock
    private RedisConnectionFactory redisConnectionFactory;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("SecurityConfig initializes and configures BCrypt password encoder")
    void securityConfig_initializesCorrectly() {
        SecurityConfig config = new SecurityConfig(jwtAuthenticationFilter, objectMapper);
        assertThat(config).isNotNull();
        assertThat(config.passwordEncoder()).isNotNull();
    }

    @Test
    @DisplayName("CorsConfig parses allowed origins and enforces credentials without wildcard")
    void corsConfig_parsesAllowedOrigins_withoutWildcard() {
        CorsConfig corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "allowedOriginsRaw", "https://superapp.onrender.com, http://localhost:3000");

        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        assertThat(source).isNotNull();

        org.springframework.mock.web.MockHttpServletRequest request = new org.springframework.mock.web.MockHttpServletRequest();
        request.setRequestURI("/api/v1/health");
        CorsConfiguration resolved = source.getCorsConfiguration(request);

        assertThat(resolved).isNotNull();
        assertThat(resolved.getAllowedOrigins()).containsExactlyInAnyOrder(
                "https://superapp.onrender.com", "http://localhost:3000"
        );
        assertThat(resolved.getAllowCredentials()).isTrue();
        assertThat(resolved.getAllowedOrigins()).doesNotContain("*");
    }

    @Test
    @DisplayName("RedisConfig falls back to ConcurrentMapCacheManager when connection fails")
    void redisConfig_fallsBackToConcurrentMapCacheManager_onConnectionError() {
        when(redisConnectionFactory.getConnection()).thenThrow(new RuntimeException("Redis connection refused"));

        RedisConfig redisConfig = new RedisConfig();
        CacheManager cacheManager = redisConfig.cacheManager(redisConnectionFactory);

        assertThat(cacheManager).isInstanceOf(ConcurrentMapCacheManager.class);
        assertThat(cacheManager.getCache("categories")).isNotNull();
        assertThat(cacheManager.getCache("nearby")).isNotNull();
    }
}
