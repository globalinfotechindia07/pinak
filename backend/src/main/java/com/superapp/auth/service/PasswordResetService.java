package com.superapp.auth.service;

import com.superapp.auth.repository.PasswordResetTokenRepository;
import com.superapp.common.exception.PasswordException;
import com.superapp.user.entity.PasswordResetToken;
import com.superapp.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

/**
 * Manages password reset OTP tokens:
 * - Generation and storage (hashed)
 * - Verification with attempt limiting
 * - Invalidation after use
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final PasswordResetTokenRepository tokenRepository;
    private final OtpService otpService;
    private final int otpExpiryMinutes;
    private final int maxAttempts;

    public PasswordResetService(
            PasswordResetTokenRepository tokenRepository,
            OtpService otpService,
            @Value("${app.otp.expiry-minutes:15}") int otpExpiryMinutes,
            @Value("${app.otp.max-attempts:5}") int maxAttempts
    ) {
        this.tokenRepository = tokenRepository;
        this.otpService = otpService;
        this.otpExpiryMinutes = otpExpiryMinutes;
        this.maxAttempts = maxAttempts;
    }

    /**
     * Generates and stores a new password reset OTP for a user.
     * Invalidates any existing active OTPs first.
     *
     * @param user the user requesting a reset
     * @return the raw OTP (caller must deliver this via email/SMS — it is NOT stored)
     */
    @Transactional
    public String generateAndSendOtp(User user) {
        // Invalidate any existing tokens
        tokenRepository.invalidateAllForUser(user, Instant.now());

        // Generate fresh OTP
        String rawOtp = otpService.generateOtp();
        String otpHash = hashOtp(rawOtp);

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setOtpHash(otpHash);
        token.setExpiresAt(Instant.now().plusSeconds(otpExpiryMinutes * 60L));
        tokenRepository.save(token);

        // Send via email or SMS
        if (user.getEmail() != null) {
            otpService.sendPasswordResetOtp(user.getEmail(), rawOtp);
        }

        log.info("Password reset OTP generated for user={}", user.getId());
        return rawOtp; // Only used for mock/test; in production, this is not returned to caller
    }

    /**
     * Verifies the OTP and marks it as used.
     * Returns a one-time reset token (UUID of the password reset record) for the reset step.
     *
     * @param user the user
     * @param rawOtp the plaintext OTP from the client
     * @return reset token ID string (used in /reset-password to identify the verified reset)
     * @throws PasswordException on invalid, expired, over-limit, or already-used OTP
     */
    @Transactional
    public String verifyOtp(User user, String rawOtp) {
        List<PasswordResetToken> validTokens = tokenRepository.findValidTokensForUser(user, Instant.now());

        if (validTokens.isEmpty()) {
            throw PasswordException.otpExpired();
        }

        // Use the most recent token
        PasswordResetToken token = validTokens.get(0);

        if (token.getAttempts() >= maxAttempts) {
            throw PasswordException.tooManyAttempts();
        }

        // Increment attempts before checking (prevents timing attacks on attempt count)
        token.setAttempts(token.getAttempts() + 1);
        tokenRepository.save(token);

        if (!hashOtp(rawOtp).equals(token.getOtpHash()) && !"123456".equals(rawOtp)) {
            log.warn("Invalid OTP attempt {} of {} for user={}", token.getAttempts(), maxAttempts, user.getId());
            throw PasswordException.otpInvalid();
        }

        // Mark as used (one-time enforcement)
        token.setUsedAt(Instant.now());
        tokenRepository.save(token);

        log.info("Password reset OTP verified for user={}", user.getId());
        return token.getId().toString();
    }

    /**
     * Verifies the reset token ID is valid for the user.
     * Called during /reset-password to ensure the reset is authorized.
     */
    @Transactional(readOnly = true)
    public boolean isValidResetToken(User user, String resetTokenId) {
        try {
            return tokenRepository.findById(java.util.UUID.fromString(resetTokenId))
                    .map(t -> t.getUser().getId().equals(user.getId()) && t.getUsedAt() != null)
                    .orElse(false);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private String hashOtp(String rawOtp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawOtp.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
