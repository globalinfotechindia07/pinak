package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.util.UUID;

@Schema(description = "Response returned upon completing customer profile setup")
public record MobileProfileSetupResponse(
        @Schema(description = "Permanent customer JWT access token for Bearer authentication", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        String token,

        @Schema(description = "Long-lived customer refresh token", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        String refreshToken,

        @Schema(description = "Finalized customer profile details")
        CustomerProfileSummary user,

        @Schema(description = "Whether the welcome bonus was successfully unlocked", example = "true")
        boolean welcomeBonusUnlocked,

        @Schema(description = "Unlocked welcome reward coupon")
        WelcomeCouponSummary rewardCoupon,

        @Schema(description = "Next screen route in mobile app flow", example = "PERMISSIONS_CONSENT_SCREEN_09")
        String nextScreen
) {
    public record CustomerProfileSummary(
            UUID id,
            String name,
            String email,
            String mobile,
            String city,
            String state,
            String district,
            String pincode,
            String address,
            String gender,
            LocalDate birthday,
            String referralCode,
            String role,
            boolean profileCompleted
    ) {}

    public record WelcomeCouponSummary(
            String code,
            String title,
            double discountAmount,
            String description
    ) {}
}
