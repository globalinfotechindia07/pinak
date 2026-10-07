package com.superapp.transaction.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
public class NotificationCacheService {

    private static final Logger log = LoggerFactory.getLogger(NotificationCacheService.class);
    private static final String KEY_PREFIX = "notifications:unread:";
    private static final Duration TTL = Duration.ofMinutes(10);

    private final StringRedisTemplate redisTemplate;

    public NotificationCacheService(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public Optional<Long> getUnreadCount(UUID userId) {
        if (redisTemplate == null || userId == null) return Optional.empty();
        try {
            String key = KEY_PREFIX + userId;
            String val = redisTemplate.opsForValue().get(key);
            if (val != null && !val.isBlank()) {
                return Optional.of(Long.parseLong(val.trim()));
            }
        } catch (Exception ex) {
            log.warn("Redis GET failed for unread notifications count userId={}: {}", userId, ex.getMessage());
        }
        return Optional.empty();
    }

    public void putUnreadCount(UUID userId, long count) {
        if (redisTemplate == null || userId == null) return;
        try {
            String key = KEY_PREFIX + userId;
            redisTemplate.opsForValue().set(key, String.valueOf(count), TTL);
        } catch (Exception ex) {
            log.warn("Redis PUT failed for unread notifications count userId={}: {}", userId, ex.getMessage());
        }
    }

    public void evictUnreadCount(UUID userId) {
        if (redisTemplate == null || userId == null) return;
        try {
            String key = KEY_PREFIX + userId;
            redisTemplate.delete(key);
        } catch (Exception ex) {
            log.warn("Redis EVICT failed for unread notifications count userId={}: {}", userId, ex.getMessage());
        }
    }

    public void incrementUnreadCount(UUID userId) {
        if (redisTemplate == null || userId == null) return;
        try {
            String key = KEY_PREFIX + userId;
            Boolean hasKey = redisTemplate.hasKey(key);
            if (Boolean.TRUE.equals(hasKey)) {
                redisTemplate.opsForValue().increment(key);
            }
        } catch (Exception ex) {
            log.warn("Redis INCREMENT failed for unread notifications count userId={}: {}", userId, ex.getMessage());
        }
    }
}
