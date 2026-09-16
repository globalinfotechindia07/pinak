package com.superapp.transaction.reward.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.transaction.reward.dto.RewardBalanceResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
public class RewardCacheService {

    private static final Logger log = LoggerFactory.getLogger(RewardCacheService.class);
    private static final String KEY_PREFIX = "reward:account:";
    private static final Duration TTL = Duration.ofMinutes(15);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public RewardCacheService(
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public Optional<RewardBalanceResponse> getAccount(UUID customerId) {
        if (redisTemplate == null || customerId == null) return Optional.empty();
        try {
            String key = KEY_PREFIX + customerId;
            String json = redisTemplate.opsForValue().get(key);
            if (json != null && !json.isBlank()) {
                return Optional.of(objectMapper.readValue(json, RewardBalanceResponse.class));
            }
        } catch (Exception ex) {
            log.warn("Redis GET failed for reward account customerId={}: {}", customerId, ex.getMessage());
        }
        return Optional.empty();
    }

    public void putAccount(UUID customerId, RewardBalanceResponse balance) {
        if (redisTemplate == null || customerId == null || balance == null) return;
        try {
            String key = KEY_PREFIX + customerId;
            String json = objectMapper.writeValueAsString(balance);
            redisTemplate.opsForValue().set(key, json, TTL);
        } catch (Exception ex) {
            log.warn("Redis PUT failed for reward account customerId={}: {}", customerId, ex.getMessage());
        }
    }

    public void evictAccount(UUID customerId) {
        if (redisTemplate == null || customerId == null) return;
        try {
            String key = KEY_PREFIX + customerId;
            redisTemplate.delete(key);
        } catch (Exception ex) {
            log.warn("Redis EVICT failed for reward account customerId={}: {}", customerId, ex.getMessage());
        }
    }
}
