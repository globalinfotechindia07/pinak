package com.superapp.mobile.service;

import com.superapp.mobile.dto.MobileDtos.*;

/**
 * Service contract for PINAK mobile authentication & onboarding flows.
 */
public interface MobileAuthService {

    /**
     * Generates and delivers a cryptographically secure 6-digit OTP to the customer's phone.
     * Enforces rate limiting, 60-second cooldown, and phone normalization.
     */
    MobileSendOtpResponse sendOtp(MobileSendOtpRequest request);

    /**
     * Smart OTP verification and authentication gateway.
     * Enforces anti-brute-force attempt limits, timing-safe OTP verification,
     * and smart-routing (returning member to Home Dashboard, or new user to Profile Setup).
     */
    MobileVerifyOtpResponse verifyOtp(
            MobileVerifyOtpRequest request,
            String ipAddress,
            String userAgent,
            String requestId
    );

    /**
     * Finalizes mandatory customer profile setup (Screen 08) using scoped onboarding token.
     * Enriches customer profile with name, email, city, state, gender, address, birthday,
     * referral tracking, and category preferences from Category API.
     * Unlocks the ₹100 welcome bonus and issues permanent customer tokens.
     */
    MobileProfileSetupResponse completeProfileSetup(
            MobileProfileSetupRequest request,
            String bearerToken,
            String ipAddress,
            String userAgent
    );
}
