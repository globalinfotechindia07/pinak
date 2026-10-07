package com.superapp.auth.service;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory fallback implementation for OTP storage.
 * Used when Redis is not reachable or in standalone dev/test environments.
 */
@Component("inMemoryOtpStorageService")
public class InMemoryOtpStorageService implements OtpStorageService {

    private record OtpEntry(String code, Instant expiresAt) {}
    private record ChallengeEntry(String phone, String purpose, String otp, AtomicInteger attempts, Instant expiresAt) {}
    private record MfaEntry(UUID userId, String code, Instant expiresAt) {}

    private final Map<String, OtpEntry> otpMap = new ConcurrentHashMap<>();
    private final Map<String, AtomicInteger> attemptsMap = new ConcurrentHashMap<>();
    private final Map<String, Instant> cooldownMap = new ConcurrentHashMap<>();

    private final Map<String, ChallengeEntry> challengeMap = new ConcurrentHashMap<>();
    private final Map<String, MfaEntry> mfaMap = new ConcurrentHashMap<>();

    @Override
    public void storeOtp(String phone, String otp, Duration ttl) {
        otpMap.put(phone, new OtpEntry(otp, Instant.now().plus(ttl)));
        attemptsMap.put(phone, new AtomicInteger(0));
    }

    @Override
    public Optional<String> getOtp(String phone) {
        OtpEntry entry = otpMap.get(phone);
        if (entry == null) {
            return Optional.empty();
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            deleteOtp(phone);
            return Optional.empty();
        }
        return Optional.of(entry.code());
    }

    @Override
    public void deleteOtp(String phone) {
        otpMap.remove(phone);
        attemptsMap.remove(phone);
    }

    @Override
    public int incrementAttempts(String phone, Duration ttl) {
        AtomicInteger counter = attemptsMap.computeIfAbsent(phone, k -> new AtomicInteger(0));
        return counter.incrementAndGet();
    }

    @Override
    public void resetAttempts(String phone) {
        attemptsMap.remove(phone);
    }

    @Override
    public void setCooldown(String phone, Duration cooldownDuration) {
        cooldownMap.put(phone, Instant.now().plus(cooldownDuration));
    }

    @Override
    public boolean isCooldownActive(String phone) {
        Instant expires = cooldownMap.get(phone);
        if (expires == null) {
            return false;
        }
        if (Instant.now().isAfter(expires)) {
            cooldownMap.remove(phone);
            return false;
        }
        return true;
    }

    @Override
    public void storeOtpChallenge(String otpRequestId, String phone, String purpose, String otp, Duration ttl) {
        challengeMap.put(otpRequestId, new ChallengeEntry(phone, purpose, otp, new AtomicInteger(0), Instant.now().plus(ttl)));
    }

    @Override
    public Optional<OtpChallenge> getOtpChallenge(String otpRequestId) {
        ChallengeEntry entry = challengeMap.get(otpRequestId);
        if (entry == null) {
            return Optional.empty();
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            challengeMap.remove(otpRequestId);
            return Optional.empty();
        }
        return Optional.of(new OtpChallenge(entry.phone(), entry.purpose(), entry.otp(), entry.attempts().get()));
    }

    @Override
    public void deleteOtpChallenge(String otpRequestId) {
        challengeMap.remove(otpRequestId);
    }

    @Override
    public int incrementChallengeAttempts(String otpRequestId, Duration ttl) {
        ChallengeEntry entry = challengeMap.get(otpRequestId);
        if (entry == null) {
            return 0;
        }
        return entry.attempts().incrementAndGet();
    }

    @Override
    public void storeMfaChallenge(String challengeId, UUID userId, String code, Duration ttl) {
        mfaMap.put(challengeId, new MfaEntry(userId, code, Instant.now().plus(ttl)));
    }

    @Override
    public Optional<MfaChallenge> getMfaChallenge(String challengeId) {
        MfaEntry entry = mfaMap.get(challengeId);
        if (entry == null) {
            return Optional.empty();
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            mfaMap.remove(challengeId);
            return Optional.empty();
        }
        return Optional.of(new MfaChallenge(entry.userId(), entry.code()));
    }

    @Override
    public void deleteMfaChallenge(String challengeId) {
        mfaMap.remove(challengeId);
    }
}
