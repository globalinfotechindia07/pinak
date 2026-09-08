package com.superapp.auth.service;

import com.superapp.auth.dto.*;
import com.superapp.auth.repository.PasswordResetTokenRepository;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AuthException;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.security.JwtService;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
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

    private User activeCustomer;
    private static final String IP = "127.0.0.1";
    private static final String UA = "TestAgent/1.0";
    private static final String RID = "test-request-id";

    @BeforeEach
    void setUp() {
        activeCustomer = new User("john@example.com", "John Doe", "John", "Doe",
                "$2a$12$hashed", Role.CUSTOMER);
        activeCustomer.setId(UUID.randomUUID());
        activeCustomer.setStatus(UserStatus.ACTIVE);
    }

    @Nested
    @DisplayName("Registration")
    class RegistrationTests {

        @Test
        @DisplayName("Successful registration returns safe UserSummary")
        void successfulRegistration() {
            var request = new RegisterRequest("John", "Doe", "john@example.com", null, "StrongPass@1");

            when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
            when(passwordEncoder.encode("StrongPass@1")).thenReturn("$2a$12$hashed");
            when(userRepository.save(any(User.class))).thenReturn(activeCustomer);

            UserSummary result = authService.register(request, IP, UA, RID);

            assertThat(result).isNotNull();
            assertThat(result.email()).isEqualTo("john@example.com");
            assertThat(result.role()).isEqualTo("CUSTOMER");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Duplicate email throws DuplicateResourceException")
        void duplicateEmailThrows() {
            var request = new RegisterRequest("John", "Doe", "john@example.com", null, "StrongPass@1");
            when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(request, IP, UA, RID))
                    .isInstanceOf(DuplicateResourceException.class);

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Duplicate mobile throws DuplicateResourceException")
        void duplicateMobileThrows() {
            var request = new RegisterRequest("John", "Doe", "john@example.com", "+911234567890", "StrongPass@1");
            when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
            when(userRepository.existsByMobile("+911234567890")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(request, IP, UA, RID))
                    .isInstanceOf(DuplicateResourceException.class);
        }

        @Test
        @DisplayName("Registration with profilePictureUrl and MERCHANT role succeeds")
        void registerWithProfilePictureAndRole() {
            var request = new RegisterRequest("Jane", "Merchant", "merchant.jane@example.com",
                    null, "StrongPass@1", "https://example.com/avatar.jpg", com.superapp.user.entity.Role.MERCHANT);

            when(userRepository.existsByEmail("merchant.jane@example.com")).thenReturn(false);
            when(passwordEncoder.encode("StrongPass@1")).thenReturn("$2a$12$hashed");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(UUID.randomUUID());
                return u;
            });

            UserSummary result = authService.register(request, IP, UA, RID);

            assertThat(result).isNotNull();
            assertThat(result.email()).isEqualTo("merchant.jane@example.com");
            assertThat(result.role()).isEqualTo("MERCHANT");
            assertThat(result.profilePictureUrl()).isEqualTo("https://example.com/avatar.jpg");
        }
    }

    @Nested
    @DisplayName("Login")
    class LoginTests {

        @Test
        @DisplayName("Successful login returns AuthResponse with tokens")
        void successfulLogin() {
            var request = new LoginRequest("john@example.com", "StrongPass@1", "device-001", "My Android");

            when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(activeCustomer));
            when(passwordEncoder.matches("StrongPass@1", "$2a$12$hashed")).thenReturn(true);
            when(sessionService.createSession(any(), any(), any(), any(), any()))
                    .thenReturn(new com.superapp.user.entity.UserSession());
            when(jwtService.generateAccessToken(any(UUID.class), eq("CUSTOMER"))).thenReturn("access-token");
            when(tokenService.issueRefreshToken(any(), any())).thenReturn("refresh-token");
            when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);

            AuthResponse result = authService.login(request, IP, UA, RID);

            assertThat(result.accessToken()).isEqualTo("access-token");
            assertThat(result.refreshToken()).isEqualTo("refresh-token");
            assertThat(result.tokenType()).isEqualTo("Bearer");
            assertThat(result.user().role()).isEqualTo("CUSTOMER");
        }

        @Test
        @DisplayName("Wrong password throws AuthException with INVALID_CREDENTIALS")
        void wrongPasswordThrows() {
            var request = new LoginRequest("john@example.com", "WrongPassword@1", null, null);

            when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(activeCustomer));
            when(passwordEncoder.matches("WrongPassword@1", "$2a$12$hashed")).thenReturn(false);

            assertThatThrownBy(() -> authService.login(request, IP, UA, RID))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("Invalid credentials");
        }

        @Test
        @DisplayName("Non-existing account throws INVALID_CREDENTIALS (no enumeration)")
        void nonExistingAccountThrows() {
            var request = new LoginRequest("nobody@example.com", "Any@1234", null, null);

            when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());
            when(userRepository.findByMobile("nobody@example.com")).thenReturn(Optional.empty());

            // Must throw AuthException with INVALID_CREDENTIALS — not USER_NOT_FOUND
            assertThatThrownBy(() -> authService.login(request, IP, UA, RID))
                    .isInstanceOf(AuthException.class)
                    .satisfies(e -> assertThat(((AuthException) e).getErrorCode().name())
                            .isEqualTo("INVALID_CREDENTIALS"));
        }

        @Test
        @DisplayName("Blocked account throws ACCOUNT_BLOCKED")
        void blockedAccountThrows() {
            activeCustomer.setStatus(UserStatus.BLOCKED);
            var request = new LoginRequest("john@example.com", "StrongPass@1", null, null);

            when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(activeCustomer));

            assertThatThrownBy(() -> authService.login(request, IP, UA, RID))
                    .isInstanceOf(AuthException.class)
                    .satisfies(e -> assertThat(((AuthException) e).getErrorCode().name())
                            .isEqualTo("ACCOUNT_BLOCKED"));
        }

        @Test
        @DisplayName("Inactive account throws ACCOUNT_INACTIVE")
        void inactiveAccountThrows() {
            activeCustomer.setStatus(UserStatus.INACTIVE);
            var request = new LoginRequest("john@example.com", "StrongPass@1", null, null);

            when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(activeCustomer));

            assertThatThrownBy(() -> authService.login(request, IP, UA, RID))
                    .isInstanceOf(AuthException.class)
                    .satisfies(e -> assertThat(((AuthException) e).getErrorCode().name())
                            .isEqualTo("ACCOUNT_INACTIVE"));
        }

        @Test
        @DisplayName("Login by mobile number succeeds")
        void loginByMobile() {
            activeCustomer.setMobile("+911234567890");
            var request = new LoginRequest("+911234567890", "StrongPass@1", null, null);

            when(userRepository.findByEmail("+911234567890")).thenReturn(Optional.empty());
            when(userRepository.findByMobile("+911234567890")).thenReturn(Optional.of(activeCustomer));
            when(passwordEncoder.matches("StrongPass@1", "$2a$12$hashed")).thenReturn(true);
            when(sessionService.createSession(any(), any(), any(), any(), any()))
                    .thenReturn(new com.superapp.user.entity.UserSession());
            when(jwtService.generateAccessToken(any(UUID.class), any())).thenReturn("access-token");
            when(tokenService.issueRefreshToken(any(), any())).thenReturn("refresh-token");
            when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);

            AuthResponse result = authService.login(request, IP, UA, RID);
            assertThat(result).isNotNull();
        }
    }

    @Nested
    @DisplayName("Phone OTP Tests")
    class PhoneOtpTests {

        @Test
        @DisplayName("sendPhoneOtp generates and stores OTP")
        void sendPhoneOtp_success() {
            var request = new SendOtpRequest("+919876543210");
            when(otpStorageService.isCooldownActive("+919876543210")).thenReturn(false);
            when(otpService.generateOtp()).thenReturn("123456");

            SendOtpResponse response = authService.sendPhoneOtp(request, IP, UA, RID);

            assertThat(response).isNotNull();
            assertThat(response.phone()).isEqualTo("+919876543210");
            verify(otpStorageService).storeOtp(eq("+919876543210"), eq("123456"), any());
            verify(otpService).sendMobileOtp("+919876543210", "123456");
        }

        @Test
        @DisplayName("verifyPhoneOtp with valid OTP authenticates existing user")
        void verifyPhoneOtp_existingUser_success() {
            activeCustomer.setMobile("+919876543210");
            var request = new VerifyPhoneOtpRequest("+919876543210", "123456", "d1", "Pixel");

            when(otpStorageService.incrementAttempts(eq("+919876543210"), any())).thenReturn(1);
            when(otpStorageService.getOtp("+919876543210")).thenReturn(Optional.of("123456"));
            when(userRepository.findByMobile("+919876543210")).thenReturn(Optional.of(activeCustomer));
            when(sessionService.createSession(any(), any(), any(), any(), any()))
                    .thenReturn(new com.superapp.user.entity.UserSession());
            when(jwtService.generateAccessToken(any(), any())).thenReturn("access-token-123");
            when(tokenService.issueRefreshToken(any(), any())).thenReturn("refresh-token-123");
            when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);

            AuthResponse response = authService.verifyPhoneOtp(request, IP, UA, RID);

            assertThat(response).isNotNull();
            assertThat(response.accessToken()).isEqualTo("access-token-123");
            verify(otpStorageService).deleteOtp("+919876543210");
        }

        @Test
        @DisplayName("verifyPhoneOtp with invalid OTP throws exception")
        void verifyPhoneOtp_wrongOtp_throws() {
            var request = new VerifyPhoneOtpRequest("+919876543210", "000000", null, null);

            when(otpStorageService.incrementAttempts(eq("+919876543210"), any())).thenReturn(1);
            when(otpStorageService.getOtp("+919876543210")).thenReturn(Optional.of("123456"));

            assertThatThrownBy(() -> authService.verifyPhoneOtp(request, IP, UA, RID))
                    .isInstanceOf(AuthException.class);
        }
    }
}
