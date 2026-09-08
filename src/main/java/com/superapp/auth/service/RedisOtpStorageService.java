package com.superapp.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

/**
 * Production Redis-backed OTP storage service with seamless in-memory fallback.
 * Keys:
 * - otp:code:{phone}
 * - otp:attempts:{phone}
 * - otp:cooldown:{phone}
 */
@Service
@Primary
public class RedisOtpStorageService implements OtpStorageService {

    private static final Logger log = LoggerFactory.getLogger(RedisOtpStorageService.class);

    private static final String PREFIX_CODE = "otp:code:";
    private static final String PREFIX_ATTEMPTS = "otp:attempts:";
    private static final String PREFIX_COOLDOWN = "otp:cooldown:";

    private final StringRedisTemplate redisTemplate;
    private final OtpStorageService inMemoryFallback;

    public RedisOtpStorageService(
            StringRedisTemplate redisTemplate,
            @Qualifier("inMemoryOtpStorageService") OtpStorageService inMemoryFallback
    ) {
        this.redisTemplate = redisTemplate;
        this.inMemoryFallback = inMemoryFallback;
    }

    @Override
    public void storeOtp(String phone, String otp, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(PREFIX_CODE + phone, otp, ttl);
            redisTemplate.delete(PREFIX_ATTEMPTS + phone);
        } catch (Exception e) {
            log.warn("Redis unavailable for storeOtp({}), falling back to in-memory: {}", phone, e.getMessage());
            inMemoryFallback.storeOtp(phone, otp, ttl);
        }
    }

    @Override
    public Optional<String> getOtp(String phone) {
        try {
            String otp = redisTemplate.opsForValue().get(PREFIX_CODE + phone);
            return Optional.ofNullable(otp);
        } catch (Exception e) {
            log.warn("Redis unavailable for getOtp({}), falling back to in-memory: {}", phone, e.getMessage());
            return inMemoryFallback.getOtp(phone);
        }
    }

    @Override
    public void deleteOtp(String phone) {
        try {
            redisTemplate.delete(PREFIX_CODE + phone);
            redisTemplate.delete(PREFIX_ATTEMPTS + phone);
        } catch (Exception e) {
            log.warn("Redis unavailable for deleteOtp({}), falling back to in-memory: {}", phone, e.getMessage());
            inMemoryFallback.deleteOtp(phone);
        }
    }

    @Override
    public int incrementAttempts(String phone, Duration ttl) {
        try {
            Long count = redisTemplate.opsForValue().increment(PREFIX_ATTEMPTS + phone);
            if (count != null && count == 1) {
                redisTemplate.expire(PREFIX_ATTEMPTS + phone, ttl);
            }
            return count != null ? count.intValue() : 1;
        } catch (Exception e) {
            log.warn("Redis unavailable for incrementAttempts({}), falling back to in-memory: {}", phone, e.getMessage());
            return inMemoryFallback.incrementAttempts(phone, ttl);
        }
    }

    @Override
    public void resetAttempts(String phone) {
        try {
            redisTemplate.delete(PREFIX_ATTEMPTS + phone);
        } catch (Exception e) {
            log.warn("Redis unavailable for resetAttempts({}), falling back to in-memory: {}", phone, e.getMessage());
            inMemoryFallback.resetAttempts(phone);
        }
    }

    @Override
    public void setCooldown(String phone, Duration cooldownDuration) {
        try {
            redisTemplate.opsForValue().set(PREFIX_COOLDOWN + phone, "ACTIVE", cooldownDuration);
        } catch (Exception e) {
            log.warn("Redis unavailable for setCooldown({}), falling back to in-memory: {}", phone, e.getMessage());
            inMemoryFallback.setCooldown(phone, cooldownDuration);
        }
    }

    @Override
    public boolean isCooldownActive(String phone) {
        try {
            Boolean hasKey = redisTemplate.hasKey(PREFIX_COOLDOWN + phone);
            return Boolean.TRUE.equals(hasKey);
        } catch (Exception e) {
            log.warn("Redis unavailable for isCooldownActive({}), falling back to in-memory: {}", phone, e.getMessage());
            return inMemoryFallback.isCooldownActive(phone);
        }
    }
}
