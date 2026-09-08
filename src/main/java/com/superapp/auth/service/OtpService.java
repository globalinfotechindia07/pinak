package com.superapp.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

/**
 * Generates and delivers OTPs for password reset, email verification, and mobile verification.
 * <p>
 * In local dev (app.mail.mock=true): OTP is only printed to the log — no real delivery.
 * In production: swap mock implementations with real mail/SMS senders.
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final boolean mockMode;
    private final int otpLength;

    public OtpService(
            @Value("${app.mail.mock:true}") boolean mockMode,
            @Value("${app.otp.length:6}") int otpLength
    ) {
        this.mockMode = mockMode;
        this.otpLength = otpLength;
    }

    /**
     * Generates a cryptographically secure numeric OTP of configured length.
     */
    public String generateOtp() {
        int max = (int) Math.pow(10, otpLength);
        int min = (int) Math.pow(10, otpLength - 1);
        int otp = min + SECURE_RANDOM.nextInt(max - min);
        return String.valueOf(otp);
    }

    /**
     * Sends (or mocks) a password reset OTP to the user's email.
     *
     * @param email  recipient email
     * @param otp    the plaintext OTP (NOT stored — only its hash is stored in DB)
     */
    public void sendPasswordResetOtp(String email, String otp) {
        if (mockMode) {
            log.info("🔐 [MOCK] Password Reset OTP for {}: {} (expires in {} min) — NOT sent via email",
                    email, otp, "${app.otp.expiry-minutes:15}");
        } else {
            // TODO: Integrate real SMTP via JavaMailSender
            log.warn("Real mail sending not implemented. Falling back to mock mode for: {}", email);
            log.info("🔐 [MOCK-FALLBACK] Password Reset OTP for {}: {}", email, otp);
        }
    }

    /**
     * Sends (or mocks) an email verification OTP.
     */
    public void sendEmailVerificationOtp(String email, String otp) {
        if (mockMode) {
            log.info("📧 [MOCK] Email Verification OTP for {}: {} — NOT sent via email", email, otp);
        } else {
            log.info("📧 [MOCK-FALLBACK] Email Verification OTP for {}: {}", email, otp);
        }
    }

    /**
     * Sends (or mocks) a mobile OTP via SMS.
     */
    public void sendMobileOtp(String mobile, String otp) {
        if (mockMode) {
            log.info("📱 [MOCK] Mobile OTP for {}: {} — NOT sent via SMS", mobile, otp);
        } else {
            log.info("📱 [MOCK-FALLBACK] Mobile OTP for {}: {}", mobile, otp);
        }
    }
}
