package com.superapp.auth.service;

import java.time.Duration;
import java.util.Optional;

/**
 * Storage contract for one-time passwords (OTP).
 * Supports storage with TTL, attempt tracking, and rate limiting cooldown.
 */
public interface OtpStorageService {

    /**
     * Store an OTP for a given phone/identifier with a time-to-live.
     */
    void storeOtp(String phone, String otp, Duration ttl);

    /**
     * Retrieve the stored OTP for a phone number if present.
     */
    Optional<String> getOtp(String phone);

    /**
     * Remove / invalidate stored OTP for a phone number after successful verification.
     */
    void deleteOtp(String phone);

    /**
     * Increments verification attempt counter and returns total attempts made.
     */
    int incrementAttempts(String phone, Duration ttl);

    /**
     * Resets / clears verification attempts.
     */
    void resetAttempts(String phone);

    /**
     * Record a send timestamp or cooldown to prevent rapid OTP resend abuse.
     */
    void setCooldown(String phone, Duration cooldownDuration);

    /**
     * Checks if resend cooldown is currently active.
     */
    boolean isCooldownActive(String phone);
}
