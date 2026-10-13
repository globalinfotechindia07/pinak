package com.superapp.mobile.service;

import com.superapp.mobile.dto.MobileSendOtpRequest;
import com.superapp.mobile.dto.MobileSendOtpResponse;

/**
 * Service contract for PINAK mobile authentication & onboarding flows.
 */
public interface MobileAuthService {

    /**
     * Generates and delivers a cryptographically secure 6-digit OTP to the customer's phone.
     * Enforces rate limiting, 60-second cooldown, and phone normalization.
     *
     * @param request OTP request containing phone and preferred delivery channel
     * @return response with challenge session ID and cooldown status
     */
    MobileSendOtpResponse sendOtp(MobileSendOtpRequest request);

    /**
     * Smart OTP verification and authentication gateway.
     * Enforces anti-brute-force attempt limits, timing-safe OTP verification,
     * and smart-routing (returning member to Home Dashboard, or new user to Profile Setup).
     *
     * @param request verification request with phone, OTP code, and session ID
     * @param ipAddress client IP for audit logging
     * @param userAgent device client user agent
     * @param requestId trace request ID
     * @return response containing session tokens or scoped onboarding token
     */
    com.superapp.mobile.dto.MobileVerifyOtpResponse verifyOtp(
            com.superapp.mobile.dto.MobileVerifyOtpRequest request,
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
    com.superapp.mobile.dto.MobileProfileSetupResponse completeProfileSetup(
            com.superapp.mobile.dto.MobileProfileSetupRequest request,
            String bearerToken,
            String ipAddress,
            String userAgent
    );
}
