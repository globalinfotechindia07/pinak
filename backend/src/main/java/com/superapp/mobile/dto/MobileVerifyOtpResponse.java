package com.superapp.mobile.dto;

import com.superapp.auth.dto.AuthDTO.UserSummary;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response returned after smart OTP verification")
public record MobileVerifyOtpResponse(
        @Schema(description = "True if user is registering for the first time", example = "false")
        boolean isNewUser,

        @Schema(description = "True if user is eligible to apply a friend referral code", example = "false")
        boolean referralEligible,

        @Schema(description = "Standard JWT access token (provided for returning members)", example = "eyJhbGciOiJIUzI1NiIsInR5...")
        String token,

        @Schema(description = "Refresh token for rotating access tokens", example = "eyJhbGciOiJIUzI1NiIsInR5...")
        String refreshToken,

        @Schema(description = "Scoped temporary onboarding token (provided for new users to complete setup)", example = "eyJhbGciOiJIUzI1NiIsInR5...")
        String onboardingToken,

        @Schema(description = "Summary of the authenticated user")
        UserSummary user,

        @Schema(description = "Welcome bonus summary unlocked upon registration")
        WelcomeBonusSummary welcomeBonus,

        @Schema(description = "Target destination screen in mobile UI", example = "HOME_DASHBOARD")
        String nextScreen
) {
    @Schema(description = "Welcome bonus unlocked for first-time signups")
    public record WelcomeBonusSummary(
            @Schema(description = "Whether the bonus is claimed", example = "false")
            boolean claimed,

            @Schema(description = "Bonus discount / cashback amount in rupees", example = "100.00")
            Double amount,

            @Schema(description = "Coupon code unlockable on profile setup", example = "WELCOME100")
            String unlockedCouponCode,

            @Schema(description = "Description of the bonus benefit", example = "Flat ₹100 discount coupon unlocks on profile completion")
            String description
    ) {}
}
