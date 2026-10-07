package com.superapp.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisOtpStorageServiceTest {

    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOperations;
    @Spy InMemoryOtpStorageService inMemoryFallback = new InMemoryOtpStorageService();

    @InjectMocks RedisOtpStorageService redisOtpStorageService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("storeOtp and getOtp work via Redis")
    void storeAndGetOtp_redis_success() {
        when(valueOperations.get("otp:code:+919876543210")).thenReturn("654321");

        redisOtpStorageService.storeOtp("+919876543210", "654321", Duration.ofMinutes(5));
        verify(valueOperations).set(eq("otp:code:+919876543210"), eq("654321"), eq(Duration.ofMinutes(5)));

        Optional<String> result = redisOtpStorageService.getOtp("+919876543210");
        assertThat(result).contains("654321");
    }

    @Test
    @DisplayName("storeOtp and getOtp fallback to InMemory when Redis throws exception")
    void fallbackToInMemory_whenRedisFails() {
        doThrow(new RuntimeException("Redis connection refused"))
                .when(valueOperations).set(any(), any(), any());

        redisOtpStorageService.storeOtp("+919876543210", "112233", Duration.ofMinutes(5));

        // When getOtp also fails on Redis, it should fetch from in-memory fallback
        when(valueOperations.get(any())).thenThrow(new RuntimeException("Redis connection refused"));

        Optional<String> result = redisOtpStorageService.getOtp("+919876543210");
        assertThat(result).contains("112233");
    }
}
