package com.superapp.mobile.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.auth.dto.AuthDTO.UserSummary;
import com.superapp.common.exception.AuthException;
import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.mobile.dto.MobileDtos.*;
import com.superapp.mobile.service.MobileAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class MobileAuthControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private MobileAuthService mobileAuthService;

    @InjectMocks
    private MobileAuthController mobileAuthController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(mobileAuthController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/mobile/auth/send-otp - Successfully triggers OTP")
    void testSendOtp_Success() throws Exception {
        String testPhone = "+919871112233";
        MobileSendOtpRequest request = new MobileSendOtpRequest(testPhone, "SMS", true, false, null);
        MobileSendOtpResponse mockResponse = new MobileSendOtpResponse(
                "otp_sess_12345", testPhone, "SMS", 60, true
        );

        when(mobileAuthService.sendOtp(any(MobileSendOtpRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/mobile/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.phone").value(testPhone))
                .andExpect(jsonPath("$.data.sessionId").value("otp_sess_12345"))
                .andExpect(jsonPath("$.data.resendAvailableInSeconds").value(60));
    }

    @Test
    @DisplayName("POST /api/v1/mobile/auth/resend-otp - Alias route successfully resends OTP")
    void testResendOtp_Success() throws Exception {
        String testPhone = "+919871112233";
        MobileSendOtpRequest request = new MobileSendOtpRequest(testPhone, "SMS", true, false, null);
        MobileSendOtpResponse mockResponse = new MobileSendOtpResponse(
                "otp_sess_67890", testPhone, "SMS", 60, true
        );

        when(mobileAuthService.sendOtp(any(MobileSendOtpRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/mobile/auth/resend-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sessionId").value("otp_sess_67890"));
    }

    @Test
    @DisplayName("POST /api/v1/mobile/auth/verify-otp - Returning member receives JWT & HOME_DASHBOARD route")
    void testVerifyOtp_ReturningMember() throws Exception {
        MobileVerifyOtpRequest request = new MobileVerifyOtpRequest("+919876543210", "123456", "otp_sess_123");
        UserSummary summary = new UserSummary(
                "u-123", "Rahul Sharma", "rahul@pinak.app", "+919876543210", "CUSTOMER", "ACTIVE",
                true, true, null, null, null, null, null, null, null
        );
        MobileVerifyOtpResponse response = new MobileVerifyOtpResponse(
                false, false, "jwt-access-token", "jwt-refresh-token", null, summary, null, "HOME_DASHBOARD"
        );

        when(mobileAuthService.verifyOtp(any(MobileVerifyOtpRequest.class), any(), any(), any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/mobile/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isNewUser").value(false))
                .andExpect(jsonPath("$.data.nextScreen").value("HOME_DASHBOARD"))
                .andExpect(jsonPath("$.data.token").value("jwt-access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("jwt-refresh-token"));
    }

    @Test
    @DisplayName("POST /api/v1/mobile/auth/verify-otp - New user receives onboardingToken & PROFILE_SETUP route")
    void testVerifyOtp_NewUser() throws Exception {
        MobileVerifyOtpRequest request = new MobileVerifyOtpRequest("+919871112233", "123456", "otp_sess_456");
        MobileVerifyOtpResponse.WelcomeBonusSummary welcomeBonus = new MobileVerifyOtpResponse.WelcomeBonusSummary(
                true, 100.0, "WELCOME100", "Flat ₹100 discount coupon unlocks on profile completion"
        );
        MobileVerifyOtpResponse response = new MobileVerifyOtpResponse(
                true, true, null, null, "onboarding-token-xyz", null, welcomeBonus, "PROFILE_SETUP_SCREEN_08"
        );

        when(mobileAuthService.verifyOtp(any(MobileVerifyOtpRequest.class), any(), any(), any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/mobile/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isNewUser").value(true))
                .andExpect(jsonPath("$.data.nextScreen").value("PROFILE_SETUP_SCREEN_08"))
                .andExpect(jsonPath("$.data.onboardingToken").value("onboarding-token-xyz"))
                .andExpect(jsonPath("$.data.welcomeBonus.unlockedCouponCode").value("WELCOME100"));
    }

    @Test
    @DisplayName("POST /api/v1/mobile/auth/verify-otp - Rejects invalid OTP code with 401 Unauthorized")
    void testVerifyOtp_InvalidOtp() throws Exception {
        MobileVerifyOtpRequest request = new MobileVerifyOtpRequest("+919871112233", "000000", "otp_sess_456");

        when(mobileAuthService.verifyOtp(any(MobileVerifyOtpRequest.class), any(), any(), any()))
                .thenThrow(AuthException.invalidCredentials("Invalid or expired OTP code."));

        mockMvc.perform(post("/api/v1/mobile/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/v1/mobile/auth/verify-otp - Rejects locked out phone with Too many failed attempts")
    void testVerifyOtp_MaxAttemptsLockout() throws Exception {
        MobileVerifyOtpRequest request = new MobileVerifyOtpRequest("+919871112233", "000000", "otp_sess_456");

        when(mobileAuthService.verifyOtp(any(MobileVerifyOtpRequest.class), any(), any(), any()))
                .thenThrow(AuthException.invalidCredentials("Too many failed attempts. Please request a new OTP."));

        mockMvc.perform(post("/api/v1/mobile/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Too many failed attempts. Please request a new OTP."))
                .andExpect(jsonPath("$.errorCode").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("POST /api/v1/mobile/auth/complete-setup - Successfully completes profile and returns full tokens")
    void testCompleteProfileSetup_Success() throws Exception {
        MobileProfileSetupRequest request = new MobileProfileSetupRequest(
                "Rahul Sharma",
                "rahul.sharma@example.com",
                "Ahmedabad",
                "Gujarat",
                "Ahmedabad",
                "380015",
                "MALE",
                "101, Galaxy Heights, S.G. Highway",
                LocalDate.of(1998, 5, 15),
                "FRIEND100",
                List.of("11111111-1111-1111-1111-111111111101", "11111111-1111-1111-1111-111111111104")
        );

        UUID userId = UUID.randomUUID();
        MobileProfileSetupResponse.CustomerProfileSummary summary = new MobileProfileSetupResponse.CustomerProfileSummary(
                userId,
                "Rahul Sharma",
                "rahul.sharma@example.com",
                "+919876543210",
                "Ahmedabad",
                "Gujarat",
                "Ahmedabad",
                "380015",
                "101, Galaxy Heights, S.G. Highway",
                "MALE",
                LocalDate.of(1998, 5, 15),
                "PINAK8899",
                "CUSTOMER",
                true
        );

        MobileProfileSetupResponse.WelcomeCouponSummary welcomeCoupon = new MobileProfileSetupResponse.WelcomeCouponSummary(
                "WELCOME100",
                "Flat ₹100 Off First Order",
                100.0,
                "Welcome to PINAK! ₹100 discount applied to your rewards wallet"
        );

        MobileProfileSetupResponse response = new MobileProfileSetupResponse(
                "final-jwt-access-token",
                "final-jwt-refresh-token",
                summary,
                true,
                welcomeCoupon,
                "PERMISSIONS_CONSENT_SCREEN_09"
        );

        when(mobileAuthService.completeProfileSetup(any(MobileProfileSetupRequest.class), any(), any(), any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/mobile/auth/complete-setup")
                        .header("Authorization", "Bearer onboarding-token-xyz")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Profile setup completed successfully"))
                .andExpect(jsonPath("$.data.token").value("final-jwt-access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("final-jwt-refresh-token"))
                .andExpect(jsonPath("$.data.welcomeBonusUnlocked").value(true))
                .andExpect(jsonPath("$.data.rewardCoupon.code").value("WELCOME100"))
                .andExpect(jsonPath("$.data.nextScreen").value("PERMISSIONS_CONSENT_SCREEN_09"))
                .andExpect(jsonPath("$.data.user.city").value("Ahmedabad"))
                .andExpect(jsonPath("$.data.user.state").value("Gujarat"))
                .andExpect(jsonPath("$.data.user.district").value("Ahmedabad"))
                .andExpect(jsonPath("$.data.user.pincode").value("380015"))
                .andExpect(jsonPath("$.data.user.gender").value("MALE"))
                .andExpect(jsonPath("$.data.user.profileCompleted").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/mobile/auth/complete-setup - Rejects missing or expired onboarding token with 401")
    void testCompleteProfileSetup_Unauthorized() throws Exception {
        MobileProfileSetupRequest request = new MobileProfileSetupRequest(
                "Rahul Sharma",
                "rahul.sharma@example.com",
                "Ahmedabad",
                "Gujarat",
                "Ahmedabad",
                "380015",
                "MALE",
                "101, Galaxy Heights, S.G. Highway",
                LocalDate.of(1998, 5, 15),
                null,
                null
        );

        when(mobileAuthService.completeProfileSetup(any(MobileProfileSetupRequest.class), any(), any(), any()))
                .thenThrow(AuthException.invalidCredentials("Invalid or expired onboarding session token."));

        mockMvc.perform(post("/api/v1/mobile/auth/complete-setup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_CREDENTIALS"));
    }
}
