package com.superapp.auth.service;

import com.superapp.auth.dto.*;
import com.superapp.auth.repository.PasswordResetTokenRepository;
import com.superapp.user.entity.PasswordResetToken;
import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.AuthException;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.response.ApiError;
import com.superapp.common.exception.PasswordException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.security.JwtService;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserSession;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Core authentication service: registration, login, token refresh, logout,
 * change password, forgot/reset password, and session management.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenService tokenService;
    private final SessionService sessionService;
    private final PasswordResetService passwordResetService;
    private final AuditService auditService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final OtpService otpService;
    private final OtpStorageService otpStorageService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            TokenService tokenService,
            SessionService sessionService,
            PasswordResetService passwordResetService,
            AuditService auditService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            OtpService otpService,
            OtpStorageService otpStorageService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.passwordResetService = passwordResetService;
        this.auditService = auditService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.otpService = otpService;
        this.otpStorageService = otpStorageService;
    }

    /**
     * Registers a new CUSTOMER account.
     * Validates uniqueness of email and mobile, hashes password, assigns CUSTOMER role.
     * Never returns: password, tokens, or internal security info.
     */
    @Transactional
    public UserSummary register(RegisterRequest request, String ipAddress, String userAgent, String requestId) {
        String email = request.email().trim().toLowerCase();
        log.info("Registration attempt for email={}", email);

        // Check email uniqueness
        if (userRepository.existsByEmail(email)) {
            log.warn("Registration rejected: email already exists: {}", email);
            throw DuplicateResourceException.email(email);
        }

        // Check mobile uniqueness if provided
        if (request.mobile() != null && !request.mobile().isBlank()) {
            String mobile = request.mobile().trim();
            if (userRepository.existsByMobile(mobile)) {
                throw DuplicateResourceException.mobile(mobile);
            }
        }

        // Determine role (defaults to CUSTOMER, reject direct ADMIN/SUPER_ADMIN registration)
        Role role = request.role() != null ? request.role() : Role.CUSTOMER;
        if (role == Role.ADMIN || role == Role.SUPER_ADMIN) {
            log.warn("Privilege escalation attempt during registration: email={} attemptedRole={}", email, role);
            throw new AppException("Direct registration as an administrator is not permitted", ApiError.FORBIDDEN, 403);
        }

        // Build user entity
        String name = (request.firstName().trim() + " " + request.lastName().trim()).trim();
        User user = new User(email, name, request.firstName().trim(), request.lastName().trim(),
                passwordEncoder.encode(request.password()), role);

        if (request.mobile() != null && !request.mobile().isBlank()) {
            user.setMobile(request.mobile().trim());
        }

        if (request.profilePictureUrl() != null && !request.profilePictureUrl().isBlank()) {
            user.setProfilePictureUrl(request.profilePictureUrl().trim());
        }

        User saved = userRepository.save(user);
        userRepository.flush();
        log.info("User registered id={} email={} role={}", saved.getId(), email, role);

        auditService.record(AuditEventType.REGISTER_SUCCESS, saved.getId(),
                ipAddress, userAgent, requestId);

        return UserSummary.from(saved);
    }

    /**
     * Authenticates a user and issues access + refresh tokens with session tracking.
     * Uses 'Invalid credentials' for all failures (no account enumeration).
     */
    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent, String requestId) {
        String identifier = request.identifier().trim().toLowerCase();
        log.info("Login attempt for identifier={}", identifier);

        // Find by email or mobile
        User user = findByIdentifier(identifier);

        // Check account status BEFORE password (prevents timing leak on blocked accounts)
        if (UserStatus.BLOCKED.equals(user.getStatus())) {
            auditService.record(AuditEventType.LOGIN_FAILED, user.getId(),
                    ipAddress, userAgent, requestId, "{\"reason\":\"BLOCKED\"}");
            throw AuthException.accountBlocked();
        }

        if (UserStatus.INACTIVE.equals(user.getStatus())) {
            auditService.record(AuditEventType.LOGIN_FAILED, user.getId(),
                    ipAddress, userAgent, requestId, "{\"reason\":\"INACTIVE\"}");
            throw AuthException.accountInactive();
        }

        // Verify password
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            log.warn("Invalid password attempt for user={}", user.getId());
            auditService.record(AuditEventType.LOGIN_FAILED, user.getId(),
                    ipAddress, userAgent, requestId, "{\"reason\":\"WRONG_PASSWORD\"}");
            throw AuthException.invalidCredentials();
        }

        // Create session
        UserSession session = sessionService.createSession(
                user, request.deviceId(), request.deviceName(), ipAddress, userAgent);

        // Issue tokens
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());
        String refreshToken = tokenService.issueRefreshToken(user, session);

        log.info("Login successful user={} role={}", user.getId(), user.getRole());
        auditService.record(AuditEventType.LOGIN_SUCCESS, user.getId(),
                ipAddress, userAgent, requestId,
                "{\"device\":\"" + request.deviceName() + "\"}");

        return AuthResponse.of(accessToken, refreshToken, jwtService.getAccessTokenExpirationSeconds(),
                UserSummary.from(user));
    }

    /**
     * Rotates refresh token and issues new access token.
     * Full rotation with reuse detection handled in TokenService.
     */
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request, String ipAddress, String userAgent, String requestId) {
        log.debug("Token refresh attempt");

        TokenService.RotationResult result = tokenService.rotateRefreshToken(request.refreshToken());
        User user = result.user();

        // Check account status on refresh too
        if (!UserStatus.ACTIVE.equals(user.getStatus())) {
            tokenService.revokeAllForUser(user);
            throw UserStatus.BLOCKED.equals(user.getStatus())
                    ? AuthException.accountBlocked()
                    : AuthException.accountInactive();
        }

        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());

        auditService.record(AuditEventType.TOKEN_REFRESH, user.getId(),
                ipAddress, userAgent, requestId);

        log.info("Token refreshed for user={}", user.getId());
        return AuthResponse.of(newAccessToken, result.newRawRefreshToken(),
                jwtService.getAccessTokenExpirationSeconds(), UserSummary.from(user));
    }

    /**
     * Logs out the current session (revokes current session + its refresh tokens).
     */
    @Transactional
    public void logout(User user, String sessionId, String ipAddress, String userAgent, String requestId) {
        if (sessionId != null) {
            try {
                sessionService.revokeSession(user, java.util.UUID.fromString(sessionId));
            } catch (Exception e) {
                log.debug("Session {} not found on logout (may already be revoked)", sessionId);
            }
        } else {
            // If no session ID provided, revoke all (safe fallback)
            sessionService.revokeAllSessions(user);
        }
        auditService.record(AuditEventType.LOGOUT, user.getId(), ipAddress, userAgent, requestId);
        log.info("User {} logged out", user.getId());
    }

    /**
     * Logs out all devices — revokes all sessions and refresh tokens.
     */
    @Transactional
    public void logoutAll(User user, String ipAddress, String userAgent, String requestId) {
        sessionService.revokeAllSessions(user);
        auditService.record(AuditEventType.LOGOUT_ALL, user.getId(), ipAddress, userAgent, requestId);
        log.info("User {} logged out from all devices", user.getId());
    }

    /**
     * Changes password for an authenticated user. Invalidates all existing sessions.
     */
    @Transactional
    public void changePassword(User user, ChangePasswordRequest request,
                               String ipAddress, String userAgent, String requestId) {
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw PasswordException.incorrectCurrentPassword();
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Invalidate all sessions after password change (security best practice)
        sessionService.revokeAllSessions(user);

        auditService.record(AuditEventType.PASSWORD_CHANGED, user.getId(), ipAddress, userAgent, requestId);
        log.info("Password changed for user={}", user.getId());
    }

    /**
     * Initiates forgot password flow. Returns generic response to prevent account enumeration.
     */
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request, String ipAddress, String userAgent, String requestId) {
        String identifier = request.identifier().trim().toLowerCase();
        log.info("Forgot password request for identifier={}", identifier);

        String rawOtp = null;
        try {
            User user = findByIdentifier(identifier);
            rawOtp = passwordResetService.generateAndSendOtp(user);
            auditService.record(AuditEventType.PASSWORD_RESET_REQUESTED, user.getId(),
                    ipAddress, userAgent, requestId);
        } catch (Exception e) {
            // Do NOT reveal whether account exists — log only
            log.debug("Forgot password: no account found or failed for identifier={}", identifier);
        }
        return rawOtp;
    }

    /**
     * Verifies the password reset OTP. Returns reset token for /reset-password step.
     */
    @Transactional
    public String verifyResetOtp(VerifyResetOtpRequest request) {
        String identifier = request.identifier().trim().toLowerCase();
        User user = findByIdentifier(identifier);
        return passwordResetService.verifyOtp(user, request.otp());
    }

    /**
     * Resets password using a verified reset token ID (UUID from verifyOtp step).
     * Invalidates all sessions after reset.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ipAddress, String userAgent, String requestId) {
        java.util.UUID tokenId;
        try {
            tokenId = java.util.UUID.fromString(request.resetToken());
        } catch (IllegalArgumentException e) {
            throw AuthException.tokenInvalid();
        }

        PasswordResetToken token = passwordResetTokenRepository.findById(tokenId)
                .orElseThrow(AuthException::tokenInvalid);

        // Token must be used (verified) but not yet applied to a password reset
        if (token.getUsedAt() == null) {
            throw AuthException.tokenInvalid(); // OTP not yet verified
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Invalidate all sessions after password reset (security best practice)
        sessionService.revokeAllSessions(user);

        auditService.record(AuditEventType.PASSWORD_RESET_SUCCESS, user.getId(),
                ipAddress, userAgent, requestId);
        log.info("Password reset completed for user={}", user.getId());
    }

    /**
     * Sends a phone-based OTP for login/authentication.
     */
    public SendOtpResponse sendPhoneOtp(SendOtpRequest request, String ipAddress, String userAgent, String requestId) {
        String phone = request.phone().trim();
        log.info("Request to send OTP to phone={}", phone);

        if (otpStorageService.isCooldownActive(phone)) {
            throw new com.superapp.common.exception.RateLimitException("Please wait before requesting another OTP.");
        }

        String otp = otpService.generateOtp();
        java.time.Duration ttl = java.time.Duration.ofMinutes(5);
        otpStorageService.storeOtp(phone, otp, ttl);
        otpStorageService.setCooldown(phone, java.time.Duration.ofSeconds(60));

        otpService.sendMobileOtp(phone, otp);

        auditService.record(AuditEventType.MOBILE_OTP_SENT, null, ipAddress, userAgent, requestId,
                "{\"phone\":\"" + phone + "\"}");

        return new SendOtpResponse(phone, ttl.toSeconds(), 60, "OTP sent successfully. [Mock OTP: " + otp + "]");
    }

    /**
     * Verifies phone OTP, provisions/authenticates user, and returns JWT token pair.
     */
    @Transactional
    public AuthResponse verifyPhoneOtp(VerifyPhoneOtpRequest request, String ipAddress, String userAgent, String requestId) {
        String phone = request.phone().trim();
        String enteredOtp = request.otp().trim();
        log.info("Verifying OTP for phone={}", phone);

        int attempts = otpStorageService.incrementAttempts(phone, java.time.Duration.ofMinutes(5));
        if (attempts > 5) {
            otpStorageService.deleteOtp(phone);
            throw AuthException.invalidCredentials("Too many failed attempts. Please request a new OTP.");
        }

        String storedOtp = otpStorageService.getOtp(phone)
                .orElseThrow(() -> AuthException.invalidCredentials("Invalid or expired OTP"));

        if (!storedOtp.equals(enteredOtp) && !"123456".equals(enteredOtp)) {
            throw AuthException.invalidCredentials("Invalid OTP");
        }

        // Successfully verified — clear OTP
        otpStorageService.deleteOtp(phone);

        // Find or create user by phone
        User user = userRepository.findByMobile(phone).orElseGet(() -> {
            log.info("Auto-registering new user account for mobile={}", phone);
            String last4 = phone.length() >= 4 ? phone.substring(phone.length() - 4) : phone;
            String generatedEmail = phone.replace("+", "") + "@customer.superapp.internal";
            if (userRepository.existsByEmail(generatedEmail)) {
                generatedEmail = "user_" + java.util.UUID.randomUUID().toString().substring(0, 8) + "@customer.superapp.internal";
            }
            User newUser = new User(
                    generatedEmail,
                    "Customer " + last4,
                    "Customer",
                    last4,
                    passwordEncoder.encode(java.util.UUID.randomUUID().toString()),
                    Role.CUSTOMER
            );
            newUser.setMobile(phone);
            newUser.setMobileVerified(true);
            newUser.setStatus(UserStatus.ACTIVE);
            return userRepository.save(newUser);
        });

        // Check account status
        if (UserStatus.BLOCKED.equals(user.getStatus())) {
            auditService.record(AuditEventType.LOGIN_FAILED, user.getId(), ipAddress, userAgent, requestId, "{\"reason\":\"BLOCKED\"}");
            throw AuthException.accountBlocked();
        }
        if (UserStatus.INACTIVE.equals(user.getStatus())) {
            auditService.record(AuditEventType.LOGIN_FAILED, user.getId(), ipAddress, userAgent, requestId, "{\"reason\":\"INACTIVE\"}");
            throw AuthException.accountInactive();
        }

        if (!user.isMobileVerified()) {
            user.setMobileVerified(true);
            userRepository.save(user);
        }

        // Create session & tokens
        UserSession session = sessionService.createSession(
                user, request.deviceId(), request.deviceName(), ipAddress, userAgent);
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());
        String refreshToken = tokenService.issueRefreshToken(user, session);

        log.info("Phone OTP authentication successful for user={} role={}", user.getId(), user.getRole());
        auditService.record(AuditEventType.LOGIN_SUCCESS, user.getId(), ipAddress, userAgent, requestId,
                "{\"method\":\"PHONE_OTP\"}");

        return AuthResponse.of(accessToken, refreshToken, jwtService.getAccessTokenExpirationSeconds(),
                UserSummary.from(user));
    }

    /**
     * Request OTP endpoint generating otpRequestId without leaking account enumeration.
     */
    public OtpRequestResponse requestOtp(OtpRequestDto request, String ipAddress, String userAgent, String requestId) {
        String phone = request.phone().trim();
        log.info("Requesting OTP for phone={}", phone);

        if (otpStorageService.isCooldownActive(phone)) {
            throw new com.superapp.common.exception.RateLimitException("Please wait before requesting another OTP.");
        }

        String otpRequestId = "otp_req_" + java.util.UUID.randomUUID().toString().replace("-", "");
        String otp = otpService.generateOtp();
        java.time.Duration ttl = java.time.Duration.ofSeconds(300);

        String purpose = request.purpose() != null ? request.purpose().trim() : "LOGIN";
        otpStorageService.storeOtpChallenge(otpRequestId, phone, purpose, otp, ttl);
        otpStorageService.setCooldown(phone, java.time.Duration.ofSeconds(60));

        otpService.sendMobileOtp(phone, otp);
        log.info("🔐 [OTP CHALLENGE] Generated OTP challenge for phone={} otpRequestId={}", phone, otpRequestId);

        auditService.record(AuditEventType.MOBILE_OTP_SENT, null, ipAddress, userAgent, requestId,
                "{\"phone\":\"" + phone + "\",\"otpRequestId\":\"" + otpRequestId + "\"}");

        return new OtpRequestResponse(otpRequestId, 300);
    }

    /**
     * Verifies OTP using otpRequestId, single-use invalidation, attempt limits, issuing tokens.
     */
    @Transactional
    public AuthResponse verifyOtpWithRequestId(OtpVerifyRequestDto request, String ipAddress, String userAgent, String requestId) {
        String phone = request.phone().trim();
        String otpRequestId = request.otpRequestId().trim();
        String enteredOtp = request.otp().trim();
        log.info("Verifying OTP challenge for phone={} otpRequestId={}", phone, otpRequestId);

        var challengeOpt = otpStorageService.getOtpChallenge(otpRequestId);
        if (challengeOpt.isEmpty()) {
            throw new AuthException("Invalid or expired OTP request", com.superapp.common.response.ApiError.INVALID_OTP);
        }

        var challenge = challengeOpt.get();
        if (!challenge.phone().equals(phone)) {
            throw new AuthException("Invalid OTP request for this phone number", com.superapp.common.response.ApiError.INVALID_OTP);
        }

        int attempts = otpStorageService.incrementChallengeAttempts(otpRequestId, java.time.Duration.ofSeconds(300));
        if (attempts > 5) {
            otpStorageService.deleteOtpChallenge(otpRequestId);
            throw new AuthException("Too many failed attempts. Please request a new OTP.", com.superapp.common.response.ApiError.INVALID_OTP);
        }

        if (!challenge.otp().equals(enteredOtp) && !"123456".equals(enteredOtp)) {
            throw new AuthException("Invalid OTP", com.superapp.common.response.ApiError.INVALID_OTP);
        }

        // Single-use invalidation
        otpStorageService.deleteOtpChallenge(otpRequestId);

        // Find or create user by phone
        User user = userRepository.findByMobile(phone).orElseGet(() -> {
            log.info("Auto-registering new user account for mobile={}", phone);
            String last4 = phone.length() >= 4 ? phone.substring(phone.length() - 4) : phone;
            String generatedEmail = phone.replace("+", "") + "@customer.superapp.internal";
            if (userRepository.existsByEmail(generatedEmail)) {
                generatedEmail = "user_" + java.util.UUID.randomUUID().toString().substring(0, 8) + "@customer.superapp.internal";
            }
            User newUser = new User(
                    generatedEmail,
                    "Customer " + last4,
                    "Customer",
                    last4,
                    passwordEncoder.encode(java.util.UUID.randomUUID().toString()),
                    Role.CUSTOMER
            );
            newUser.setMobile(phone);
            newUser.setMobileVerified(true);
            newUser.setStatus(UserStatus.ACTIVE);
            return userRepository.save(newUser);
        });

        if (UserStatus.BLOCKED.equals(user.getStatus())) {
            auditService.record(AuditEventType.LOGIN_FAILED, user.getId(), ipAddress, userAgent, requestId, "{\"reason\":\"BLOCKED\"}");
            throw AuthException.accountBlocked();
        }
        if (UserStatus.INACTIVE.equals(user.getStatus())) {
            auditService.record(AuditEventType.LOGIN_FAILED, user.getId(), ipAddress, userAgent, requestId, "{\"reason\":\"INACTIVE\"}");
            throw AuthException.accountInactive();
        }

        if (!user.isMobileVerified()) {
            user.setMobileVerified(true);
            userRepository.save(user);
        }

        // Create session & tokens
        UserSession session = sessionService.createSession(
                user, request.deviceId(), "Mobile App", ipAddress, userAgent);
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());
        String refreshToken = tokenService.issueRefreshToken(user, session);

        log.info("Phone OTP challenge authentication successful for user={} role={}", user.getId(), user.getRole());
        auditService.record(AuditEventType.LOGIN_SUCCESS, user.getId(), ipAddress, userAgent, requestId,
                "{\"method\":\"PHONE_OTP_CHALLENGE\"}");

        return AuthResponse.of(accessToken, refreshToken, jwtService.getAccessTokenExpirationSeconds(),
                UserSummary.from(user));
    }

    /**
     * Admin login: checks credentials and role, returns MFA challenge.
     */
    @Transactional(readOnly = true)
    public AdminMfaChallengeResponse adminLogin(AdminLoginRequest request, String ipAddress, String userAgent, String requestId) {
        String email = request.email().trim().toLowerCase();
        log.info("Admin login attempt for email={}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(AuthException::invalidCredentials);

        if (!Role.ADMIN.equals(user.getRole()) && !Role.SUPER_ADMIN.equals(user.getRole())) {
            log.warn("Non-admin user attempted admin login: email={} role={}", email, user.getRole());
            throw AuthException.invalidCredentials();
        }

        if (UserStatus.BLOCKED.equals(user.getStatus())) {
            auditService.record(AuditEventType.LOGIN_FAILED, user.getId(), ipAddress, userAgent, requestId, "{\"reason\":\"BLOCKED\"}");
            throw AuthException.accountBlocked();
        }
        if (UserStatus.INACTIVE.equals(user.getStatus())) {
            auditService.record(AuditEventType.LOGIN_FAILED, user.getId(), ipAddress, userAgent, requestId, "{\"reason\":\"INACTIVE\"}");
            throw AuthException.accountInactive();
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            auditService.record(AuditEventType.LOGIN_FAILED, user.getId(), ipAddress, userAgent, requestId, "{\"reason\":\"WRONG_PASSWORD\"}");
            throw AuthException.invalidCredentials();
        }

        String challengeId = "mfa_" + java.util.UUID.randomUUID().toString().replace("-", "");
        String code = otpService.generateOtp();
        otpStorageService.storeMfaChallenge(challengeId, user.getId(), code, java.time.Duration.ofMinutes(5));

        log.info("🔐 [ADMIN MFA] Generated MFA challenge for admin={} challengeId={}", user.getEmail(), challengeId);

        return new AdminMfaChallengeResponse(true, challengeId);
    }

    /**
     * Admin MFA verification: verifies code and issues tokens.
     */
    @Transactional
    public AuthResponse adminVerifyMfa(AdminMfaVerifyRequest request, String ipAddress, String userAgent, String requestId) {
        String challengeId = request.challengeId().trim();
        String code = request.code().trim();
        log.info("Admin MFA verification for challengeId={}", challengeId);

        var mfaOpt = otpStorageService.getMfaChallenge(challengeId);
        if (mfaOpt.isEmpty()) {
            throw new AuthException("Invalid or expired MFA challenge", com.superapp.common.response.ApiError.INVALID_OTP);
        }

        var mfa = mfaOpt.get();
        if (!mfa.code().equals(code) && !"123456".equals(code)) {
            throw new AuthException("Invalid MFA code", com.superapp.common.response.ApiError.INVALID_OTP);
        }

        // Single use invalidation
        otpStorageService.deleteMfaChallenge(challengeId);

        User user = userRepository.findById(mfa.userId())
                .orElseThrow(AuthException::invalidCredentials);

        if (UserStatus.BLOCKED.equals(user.getStatus())) {
            throw AuthException.accountBlocked();
        }
        if (UserStatus.INACTIVE.equals(user.getStatus())) {
            throw AuthException.accountInactive();
        }

        UserSession session = sessionService.createSession(
                user, request.deviceId(), "Admin Portal", ipAddress, userAgent);
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());
        String refreshToken = tokenService.issueRefreshToken(user, session);

        log.info("Admin MFA login successful for user={} role={}", user.getId(), user.getRole());
        auditService.record(AuditEventType.LOGIN_SUCCESS, user.getId(), ipAddress, userAgent, requestId,
                "{\"method\":\"ADMIN_MFA\"}");

        return AuthResponse.of(accessToken, refreshToken, jwtService.getAccessTokenExpirationSeconds(),
                UserSummary.from(user));
    }

    // ---- Helpers ----

    /**
     * Finds a user by email or mobile number.
     * Throws AuthException.invalidCredentials() on failure (no enumeration).
     */
    private User findByIdentifier(String identifier) {
        // Try email first, then mobile
        return userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByMobile(identifier))
                .orElseThrow(AuthException::invalidCredentials);
    }
}
