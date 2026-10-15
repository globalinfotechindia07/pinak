package com.superapp.mobile.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.auth.dto.AuthDTO.UserSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Consolidated Mobile DTOs for PINAK Customer App (Screens 05–09).
 * Contains all authentication, profile onboarding, geo-radar preview, and permissions payloads.
 */
public final class MobileDtos {

    private MobileDtos() {}

    // ==========================================
    // 1. Mobile OTP Authentication (Screens 05 & 07)
    // ==========================================

    @Schema(description = "Request payload to trigger a mobile OTP")
    public record MobileSendOtpRequest(
            @NotBlank(message = "Phone number is compulsory")
            @Schema(description = "Customer mobile number (10 digits or E.164 +91)", example = "+919876543210")
            String phone,

            @Schema(description = "Delivery channel (SMS or WHATSAPP)", example = "SMS", defaultValue = "SMS")
            String channel,

            @Schema(description = "User consent for WhatsApp transaction alerts", example = "true")
            Boolean whatsappAlertsEnabled,

            @Schema(description = "Soundbox / POS persistent session flag", example = "false")
            Boolean soundboxStaySignedIn,

            @Schema(description = "Optional referral code for signup bonus preview", example = "FRIEND100")
            String referralCode
    ) {}

    @Schema(description = "Response returned after triggering a mobile OTP")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record MobileSendOtpResponse(
            @Schema(description = "Unique OTP challenge session ID", example = "otp_sess_a81d4e2b")
            String sessionId,

            @Schema(description = "Normalized E.164 phone number", example = "+919876543210")
            String phone,

            @Schema(description = "Channel used for OTP delivery", example = "SMS")
            String channel,

            @Schema(description = "Cooldown period in seconds before a resend is permitted", example = "60")
            long resendAvailableInSeconds,

            @Schema(description = "SIM binding verification status flag", example = "true")
            boolean simBindingVerified,

            @Schema(description = "6-digit OTP code returned for development and testing", example = "123456")
            String otp
    ) {
        public MobileSendOtpResponse(String sessionId, String phone, String channel, long resendAvailableInSeconds, boolean simBindingVerified) {
            this(sessionId, phone, channel, resendAvailableInSeconds, simBindingVerified, null);
        }
    }

    @Schema(description = "Request payload to verify mobile OTP")
    public record MobileVerifyOtpRequest(
            @NotBlank(message = "Phone number is compulsory")
            @Schema(description = "Customer mobile number (10 digits or E.164 +91)", example = "+919876543210")
            String phone,

            @NotBlank(message = "OTP is compulsory")
            @Schema(description = "6-digit verification code", example = "123456")
            String otp,

            @Schema(description = "Challenge session ID received from send-otp", example = "otp_sess_a81d4e2b")
            String sessionId
    ) {}

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

    // ==========================================
    // 2. Mobile Profile Setup & Onboarding (Screen 08)
    // ==========================================

    @Schema(description = "Request body to complete mandatory customer profile setup (Screen 08)")
    public record MobileProfileSetupRequest(
            @NotBlank(message = "Full name is required")
            @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
            @Schema(description = "Customer full legal name", example = "Rahul Sharma")
            String fullName,

            @Email(message = "Invalid email address format")
            @Schema(description = "Customer email address for notifications and digital receipts", example = "rahul.sharma@example.com")
            String email,

            @NotBlank(message = "City is required")
            @Schema(description = "Primary operational city (e.g. Ahmedabad, Mumbai)", example = "Ahmedabad")
            String city,

            @Schema(description = "State of residence (e.g. Gujarat, Maharashtra)", example = "Gujarat")
            String state,

            @Schema(description = "District of residence (e.g. Ahmedabad, Surat)", example = "Ahmedabad")
            String district,

            @Schema(description = "Postal PIN code (e.g. 380015)", example = "380015")
            String pincode,

            @Schema(description = "Gender: MALE, FEMALE, OTHER", example = "MALE")
            String gender,

            @Schema(description = "Residential or delivery street address", example = "101, Galaxy Heights, S.G. Highway")
            String address,

            @Past(message = "Birthday must be in the past")
            @Schema(description = "Date of birth (YYYY-MM-DD) for birthday milestone rewards", example = "1998-05-15")
            LocalDate birthday,

            @Schema(description = "Optional referral code of inviting friend", example = "FRIEND100")
            String referralCode,

            @Schema(description = "List of category IDs selected from /api/v1/mobile/categories", example = "[\"3fa85f64-5717-4562-b3fc-2c963f66afa6\"]")
            List<String> categoryPreferences
    ) {}

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

    // ==========================================
    // 3. Geo-Radar Preview & Permissions (Screen 09)
    // ==========================================

    @Schema(description = "Screen 09 Geo-Radar Preview Payload")
    public record RadarPreviewResponse(
            @Schema(description = "Human-readable detected locality or city zone", example = "Indiranagar, Bangalore")
            String detectedZone,

            @Schema(description = "Total number of live partner stores in detected radius", example = "38")
            long nearbyMerchantCount,

            @Schema(description = "Hero banner discount highlight", example = "Up to 50% OFF live right now")
            String discountHighlight,

            @Schema(description = "Estimated device battery impact percentage", example = "5.0")
            double estimatedBatteryImpactPercentage,

            @Schema(description = "Sneak peek cards of top 2-3 nearby partner stores")
            List<NearbyStoreCardDto> nearbyStores,

            @Schema(description = "Privacy and security guarantee badge")
            PrivacyShieldDto privacyShield
    ) {}

    @Schema(description = "Sneak peek card of a nearby partner merchant store")
    public record NearbyStoreCardDto(
            @Schema(description = "Store UUID", example = "00000000-0000-0000-0000-000000000201")
            UUID storeId,

            @Schema(description = "Store display name", example = "Brew & Bites Cafe")
            String storeName,

            @Schema(description = "Walking or driving distance text", example = "120m away")
            String distanceText,

            @Schema(description = "Whether merchant is verified partner", example = "true")
            boolean isVerified,

            @Schema(description = "Top deal badge highlight", example = "30% OFF")
            String dealHighlight,

            @Schema(description = "Customer star rating", example = "4.9")
            double rating
    ) {}

    @Schema(description = "Privacy and security guarantee metadata")
    public record PrivacyShieldDto(
            @Schema(description = "Whether user GPS is encrypted", example = "true")
            boolean encrypted,

            @Schema(description = "Zero persistent background tracking guarantee", example = "false")
            boolean backgroundTracking,

            @Schema(description = "Compliance guarantee description", example = "NPCI & RBI compliance grade encryption")
            String complianceText
    ) {}

    @Schema(description = "Customer location and alert permissions consent payload")
    public record UpdatePermissionsRequest(
            @Schema(description = "Whether user granted device precise GPS location", example = "true")
            Boolean preciseLocationGranted,

            @Schema(description = "Whether user consented to audio flash alerts and soundbox deals", example = "true")
            Boolean flashAlertsGranted,

            @Schema(description = "Current device latitude", example = "12.9716")
            Double latitude,

            @Schema(description = "Current device longitude", example = "77.6412")
            Double longitude
    ) {}

    @Schema(description = "Response confirming location permissions consent")
    public record UpdatePermissionsResponse(
            @Schema(description = "Whether the user has completed full onboarding", example = "true")
            boolean onboardingComplete,

            @Schema(description = "Active detected user zone", example = "Indiranagar, Bangalore")
            String userZone,

            @Schema(description = "Count of active live deals in user zone", example = "38")
            int activeOffersCount,

            @Schema(description = "Routing key for the next screen in the mobile app", example = "HOME_DASHBOARD")
            String nextScreen
    ) {}
}
