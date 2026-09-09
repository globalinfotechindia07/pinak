package com.superapp.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * Production Redis-backed OTP storage service with seamless in-memory fallback.
 * Keys:
 * - otp:code:{phone}
 * - otp:attempts:{phone}
 * - otp:cooldown:{phone}
 * - auth:otp:{otpRequestId}
 * - auth:otp:attempts:{otpRequestId}
 * - auth:mfa:{challengeId}
 */
@Service
@Primary
public class RedisOtpStorageService implements OtpStorageService {

    private static final Logger log = LoggerFactory.getLogger(RedisOtpStorageService.class);

    private static final String PREFIX_CODE = "otp:code:";
    private static final String PREFIX_ATTEMPTS = "otp:attempts:";
    private static final String PREFIX_COOLDOWN = "otp:cooldown:";

    private static final String PREFIX_CHALLENGE = "auth:otp:";
    private static final String PREFIX_CHALLENGE_ATTEMPTS = "auth:otp:attempts:";
    private static final String PREFIX_MFA = "auth:mfa:";
    private static final String DELIMITER = "|||";

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

    @Override
    public void storeOtpChallenge(String otpRequestId, String phone, String purpose, String otp, Duration ttl) {
        try {
            String value = phone + DELIMITER + purpose + DELIMITER + otp;
            redisTemplate.opsForValue().set(PREFIX_CHALLENGE + otpRequestId, value, ttl);
            redisTemplate.delete(PREFIX_CHALLENGE_ATTEMPTS + otpRequestId);
        } catch (Exception e) {
            log.warn("Redis unavailable for storeOtpChallenge({}), falling back to in-memory: {}", otpRequestId, e.getMessage());
            inMemoryFallback.storeOtpChallenge(otpRequestId, phone, purpose, otp, ttl);
        }
    }

    @Override
    public Optional<OtpChallenge> getOtpChallenge(String otpRequestId) {
        try {
            String value = redisTemplate.opsForValue().get(PREFIX_CHALLENGE + otpRequestId);
            if (value == null) {
                return Optional.empty();
            }
            String[] parts = value.split("\\|\\|\\|", 3);
            if (parts.length < 3) {
                return Optional.empty();
            }
            String attemptsStr = redisTemplate.opsForValue().get(PREFIX_CHALLENGE_ATTEMPTS + otpRequestId);
            int attempts = attemptsStr != null ? Integer.parseInt(attemptsStr) : 0;
            return Optional.of(new OtpChallenge(parts[0], parts[1], parts[2], attempts));
        } catch (Exception e) {
            log.warn("Redis unavailable for getOtpChallenge({}), falling back to in-memory: {}", otpRequestId, e.getMessage());
            return inMemoryFallback.getOtpChallenge(otpRequestId);
        }
    }

    @Override
    public void deleteOtpChallenge(String otpRequestId) {
        try {
            redisTemplate.delete(PREFIX_CHALLENGE + otpRequestId);
            redisTemplate.delete(PREFIX_CHALLENGE_ATTEMPTS + otpRequestId);
        } catch (Exception e) {
            log.warn("Redis unavailable for deleteOtpChallenge({}), falling back to in-memory: {}", otpRequestId, e.getMessage());
            inMemoryFallback.deleteOtpChallenge(otpRequestId);
        }
    }

    @Override
    public int incrementChallengeAttempts(String otpRequestId, Duration ttl) {
        try {
            Long count = redisTemplate.opsForValue().increment(PREFIX_CHALLENGE_ATTEMPTS + otpRequestId);
            if (count != null && count == 1) {
                redisTemplate.expire(PREFIX_CHALLENGE_ATTEMPTS + otpRequestId, ttl);
            }
            return count != null ? count.intValue() : 1;
        } catch (Exception e) {
            log.warn("Redis unavailable for incrementChallengeAttempts({}), falling back to in-memory: {}", otpRequestId, e.getMessage());
            return inMemoryFallback.incrementChallengeAttempts(otpRequestId, ttl);
        }
    }

    @Override
    public void storeMfaChallenge(String challengeId, UUID userId, String code, Duration ttl) {
        try {
            String value = userId.toString() + DELIMITER + code;
            redisTemplate.opsForValue().set(PREFIX_MFA + challengeId, value, ttl);
        } catch (Exception e) {
            log.warn("Redis unavailable for storeMfaChallenge({}), falling back to in-memory: {}", challengeId, e.getMessage());
            inMemoryFallback.storeMfaChallenge(challengeId, userId, code, ttl);
        }
    }

    @Override
    public Optional<MfaChallenge> getMfaChallenge(String challengeId) {
        try {
            String value = redisTemplate.opsForValue().get(PREFIX_MFA + challengeId);
            if (value == null) {
                return Optional.empty();
            }
            String[] parts = value.split("\\|\\|\\|", 2);
            if (parts.length < 2) {
                return Optional.empty();
            }
            return Optional.of(new MfaChallenge(UUID.fromString(parts[0]), parts[1]));
        } catch (Exception e) {
            log.warn("Redis unavailable for getMfaChallenge({}), falling back to in-memory: {}", challengeId, e.getMessage());
            return inMemoryFallback.getMfaChallenge(challengeId);
        }
    }

    @Override
    public void deleteMfaChallenge(String challengeId) {
        try {
            redisTemplate.delete(PREFIX_MFA + challengeId);
        } catch (Exception e) {
            log.warn("Redis unavailable for deleteMfaChallenge({}), falling back to in-memory: {}", challengeId, e.getMessage());
            inMemoryFallback.deleteMfaChallenge(challengeId);
        }
    }
}
