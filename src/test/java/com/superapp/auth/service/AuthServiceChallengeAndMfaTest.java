package com.superapp.auth.service;

import com.superapp.auth.dto.AuthDTO;
import com.superapp.auth.dto.OtpDTO;
import com.superapp.auth.repository.PasswordResetTokenRepository;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AuthException;
import com.superapp.common.exception.RateLimitException;
import com.superapp.common.response.ApiError;
import com.superapp.common.security.JwtService;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.StaffMember;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserSession;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.repository.RoleRepository;
import com.superapp.user.repository.StaffMemberRepository;
import com.superapp.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceChallengeAndMfaTest {

    @Mock UserRepository userRepository;
    @Mock StaffMemberRepository staffMemberRepository;
    @Mock RoleRepository roleRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock TokenService tokenService;
    @Mock SessionService sessionService;
    @Mock PasswordResetService passwordResetService;
    @Mock AuditService auditService;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock OtpService otpService;
    @Mock OtpStorageService otpStorageService;

    @InjectMocks AuthService authService;

    private User adminUser;
    private User customerUser;
    private static final String IP = "127.0.0.1";
    private static final String UA = "TestClient/1.0";
    private static final String RID = "req-123";

    @BeforeEach
    void setUp() {
        adminUser = new User("admin@superapp.com", "Admin User", "Admin", "User",
                "$2a$12$hashedpwd", Role.ADMIN);
        adminUser.setId(UUID.randomUUID());
        adminUser.setStatus(UserStatus.ACTIVE);

        customerUser = new User("customer@superapp.com", "Customer User", "Customer", "User",
                "$2a$12$hashedpwd", Role.CUSTOMER);
        customerUser.setId(UUID.randomUUID());
        customerUser.setStatus(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("requestOtp — successfully generates challenge and returns 300s TTL")
    void requestOtp_success() {
        when(otpStorageService.isCooldownActive("+919876543210")).thenReturn(false);
        when(otpService.generateOtp()).thenReturn("654321");

        OtpDTO.RequestChallenge request = new OtpDTO.RequestChallenge("+919876543210", "LOGIN", "dev-1");
        OtpDTO.ChallengeResponse response = authService.requestOtp(request, IP, UA, RID);

        assertThat(response).isNotNull();
        assertThat(response.otpRequestId()).startsWith("otp_req_");
        assertThat(response.expiresIn()).isEqualTo(300);

        verify(otpStorageService).storeOtpChallenge(eq(response.otpRequestId()), eq("+919876543210"), eq("LOGIN"), eq("654321"), eq(Duration.ofSeconds(300)));
        verify(otpStorageService).setCooldown(eq("+919876543210"), eq(Duration.ofSeconds(60)));
        verify(otpService).sendMobileOtp("+919876543210", "654321");
    }

    @Test
    @DisplayName("requestOtp — throws RateLimitException when cooldown is active")
    void requestOtp_cooldownActive_throwsRateLimit() {
        when(otpStorageService.isCooldownActive("+919876543210")).thenReturn(true);

        OtpDTO.RequestChallenge request = new OtpDTO.RequestChallenge("+919876543210", "LOGIN", "dev-1");
        assertThatThrownBy(() -> authService.requestOtp(request, IP, UA, RID))
                .isInstanceOf(RateLimitException.class);

        verify(otpStorageService, never()).storeOtpChallenge(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("verifyOtpWithRequestId — successfully verifies and issues tokens with single-use invalidation")
    void verifyOtpWithRequestId_success() {
        String reqId = "otp_req_abc123";
        when(otpStorageService.getOtpChallenge(reqId))
                .thenReturn(Optional.of(new OtpStorageService.OtpChallenge("+919876543210", "LOGIN", "654321", 0)));
        when(otpStorageService.incrementChallengeAttempts(eq(reqId), any())).thenReturn(1);
        when(userRepository.findByMobile("+919876543210")).thenReturn(Optional.of(customerUser));

        UserSession mockSession = new UserSession();
        mockSession.setId(UUID.randomUUID());
        when(sessionService.createSession(any(), any(), any(), any(), any())).thenReturn(mockSession);
        when(jwtService.generateAccessToken(any(), any())).thenReturn("mock-access-token");
        when(tokenService.issueRefreshToken(any(), any())).thenReturn("mock-refresh-token");
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);

        OtpDTO.VerifyChallengeRequest request = new OtpDTO.VerifyChallengeRequest("+919876543210", reqId, "654321", "dev-1");
        AuthDTO.Response response = authService.verifyOtpWithRequestId(request, IP, UA, RID);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("mock-access-token");
        assertThat(response.refreshToken()).isEqualTo("mock-refresh-token");
        verify(otpStorageService).deleteOtpChallenge(reqId);
    }

    @Test
    @DisplayName("verifyOtpWithRequestId — throws INVALID_OTP when challenge expired or missing")
    void verifyOtpWithRequestId_missing_throwsInvalidOtp() {
        when(otpStorageService.getOtpChallenge("otp_req_expired")).thenReturn(Optional.empty());

        OtpDTO.VerifyChallengeRequest request = new OtpDTO.VerifyChallengeRequest("+919876543210", "otp_req_expired", "654321", "dev-1");
        assertThatThrownBy(() -> authService.verifyOtpWithRequestId(request, IP, UA, RID))
                .isInstanceOf(AuthException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiError.INVALID_OTP);
    }

    @Test
    @DisplayName("verifyOtpWithRequestId — throws INVALID_OTP on phone mismatch")
    void verifyOtpWithRequestId_phoneMismatch_throwsInvalidOtp() {
        when(otpStorageService.getOtpChallenge("otp_req_123"))
                .thenReturn(Optional.of(new OtpStorageService.OtpChallenge("+919876543210", "LOGIN", "654321", 0)));

        OtpDTO.VerifyChallengeRequest request = new OtpDTO.VerifyChallengeRequest("+919999999999", "otp_req_123", "654321", "dev-1");
        assertThatThrownBy(() -> authService.verifyOtpWithRequestId(request, IP, UA, RID))
                .isInstanceOf(AuthException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiError.INVALID_OTP);
    }

    @Test
    @DisplayName("verifyOtpWithRequestId — too many failed attempts invalidates challenge")
    void verifyOtpWithRequestId_tooManyAttempts_invalidatesChallenge() {
        String reqId = "otp_req_attempts";
        when(otpStorageService.getOtpChallenge(reqId))
                .thenReturn(Optional.of(new OtpStorageService.OtpChallenge("+919876543210", "LOGIN", "654321", 5)));
        when(otpStorageService.incrementChallengeAttempts(eq(reqId), any())).thenReturn(6);

        OtpDTO.VerifyChallengeRequest request = new OtpDTO.VerifyChallengeRequest("+919876543210", reqId, "111111", "dev-1");
        assertThatThrownBy(() -> authService.verifyOtpWithRequestId(request, IP, UA, RID))
                .isInstanceOf(AuthException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiError.INVALID_OTP);

        verify(otpStorageService).deleteOtpChallenge(reqId);
    }

    @Test
    @DisplayName("adminLogin — generates MFA challenge for valid ADMIN user")
    void adminLogin_success() {
        when(userRepository.findByEmail("admin@superapp.com")).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.matches("Secret@123", adminUser.getPassword())).thenReturn(true);
        when(otpService.generateOtp()).thenReturn("987654");

        AuthDTO.AdminLoginRequest request = new AuthDTO.AdminLoginRequest("admin@superapp.com", "Secret@123", "admin-device");
        AuthDTO.AdminMfaChallengeResponse response = authService.adminLogin(request, IP, UA, RID);

        assertThat(response).isNotNull();
        assertThat(response.mfaRequired()).isTrue();
        assertThat(response.challengeId()).startsWith("mfa_");
        verify(otpStorageService).storeMfaChallenge(eq(response.challengeId()), eq(adminUser.getId()), eq("987654"), eq(Duration.ofMinutes(5)));
    }

    @Test
    @DisplayName("adminLogin — generates MFA challenge for user with active PLATFORM staff member role")
    void adminLogin_platformStaff_success() {
        User staffUser = new User("ops@superapp.com", "Ops Manager", "Ops", "Manager",
                "$2a$12$hashedpwd", Role.CUSTOMER); // Role in users is customer or staff
        staffUser.setId(UUID.randomUUID());
        staffUser.setStatus(UserStatus.ACTIVE);

        StaffMember staff = new StaffMember(staffUser.getId(), "PLATFORM", "REGIONAL_OPS", "ACTIVE");

        when(userRepository.findByEmail("ops@superapp.com")).thenReturn(Optional.of(staffUser));
        when(staffMemberRepository.findActivePlatformStaff(staffUser.getId())).thenReturn(Optional.of(staff));
        when(passwordEncoder.matches("Secret@123", staffUser.getPassword())).thenReturn(true);
        when(otpService.generateOtp()).thenReturn("987654");

        AuthDTO.AdminLoginRequest request = new AuthDTO.AdminLoginRequest("ops@superapp.com", "Secret@123", "ops-device");
        AuthDTO.AdminMfaChallengeResponse response = authService.adminLogin(request, IP, UA, RID);

        assertThat(response).isNotNull();
        assertThat(response.mfaRequired()).isTrue();
    }

    @Test
    @DisplayName("adminLogin — rejects non-admin and non-platform staff with INVALID_CREDENTIALS")
    void adminLogin_nonAdmin_rejected() {
        when(userRepository.findByEmail("customer@superapp.com")).thenReturn(Optional.of(customerUser));
        when(staffMemberRepository.findActivePlatformStaff(customerUser.getId())).thenReturn(Optional.empty());

        AuthDTO.AdminLoginRequest request = new AuthDTO.AdminLoginRequest("customer@superapp.com", "Secret@123", "device-x");
        assertThatThrownBy(() -> authService.adminLogin(request, IP, UA, RID))
                .isInstanceOf(AuthException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiError.INVALID_CREDENTIALS);
    }

    @Test
    @DisplayName("adminVerifyMfa — successfully verifies MFA code and issues admin JWT")
    void adminVerifyMfa_success() {
        String challengeId = "mfa_challenge_001";
        when(otpStorageService.getMfaChallenge(challengeId))
                .thenReturn(Optional.of(new OtpStorageService.MfaChallenge(adminUser.getId(), "987654")));
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));

        UserSession mockSession = new UserSession();
        mockSession.setId(UUID.randomUUID());
        when(sessionService.createSession(any(), any(), any(), any(), any())).thenReturn(mockSession);
        when(jwtService.generateAccessToken(any(), any())).thenReturn("admin-access-token");
        when(tokenService.issueRefreshToken(any(), any())).thenReturn("admin-refresh-token");
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);

        AuthDTO.AdminMfaVerifyRequest request = new AuthDTO.AdminMfaVerifyRequest(challengeId, "987654", "admin-device");
        AuthDTO.Response response = authService.adminVerifyMfa(request, IP, UA, RID);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("admin-access-token");
        assertThat(response.user().role()).isEqualTo(Role.ADMIN.name());
        verify(otpStorageService).deleteMfaChallenge(challengeId);
    }

    @Test
    @DisplayName("adminVerifyMfa — throws INVALID_OTP on wrong code")
    void adminVerifyMfa_wrongCode_throwsInvalidOtp() {
        String challengeId = "mfa_challenge_001";
        when(otpStorageService.getMfaChallenge(challengeId))
                .thenReturn(Optional.of(new OtpStorageService.MfaChallenge(adminUser.getId(), "987654")));

        AuthDTO.AdminMfaVerifyRequest request = new AuthDTO.AdminMfaVerifyRequest(challengeId, "000000", "admin-device");
        assertThatThrownBy(() -> authService.adminVerifyMfa(request, IP, UA, RID))
                .isInstanceOf(AuthException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiError.INVALID_OTP);

        verify(otpStorageService, never()).deleteMfaChallenge(challengeId);
    }
}
