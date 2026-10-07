package com.superapp.auth.controller;

import com.superapp.auth.dto.AuthDTO;
import com.superapp.auth.dto.OtpDTO;
import com.superapp.auth.dto.SessionDTO;
import com.superapp.auth.service.AuthService;
import com.superapp.auth.service.CookieService;
import com.superapp.auth.service.SessionService;
import com.superapp.common.config.RateLimitService;
import com.superapp.common.exception.AuthException;
import com.superapp.common.response.ApiResponse;
import com.superapp.common.security.CustomUserDetailsService;
import com.superapp.common.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Authentication controller: registration, login, POS PIN login, token management,
 * password management, email/mobile verification, session management, and CSRF token distribution.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Authentication, token management, and password operations")
public class AuthController {

    private final AuthService authService;
    private final SessionService sessionService;
    private final CustomUserDetailsService userDetailsService;
    private final RateLimitService rateLimitService;
    private final CookieService cookieService;
    private final JwtService jwtService;
    @Autowired(required = false)
    private com.superapp.user.service.UserService userService;

    @Autowired
    public AuthController(
            AuthService authService,
            SessionService sessionService,
            CustomUserDetailsService userDetailsService,
            RateLimitService rateLimitService,
            CookieService cookieService,
            JwtService jwtService
    ) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.userDetailsService = userDetailsService;
        this.rateLimitService = rateLimitService;
        this.cookieService = cookieService;
        this.jwtService = jwtService;
    }

    public AuthController(
            AuthService authService,
            SessionService sessionService,
            CustomUserDetailsService userDetailsService,
            RateLimitService rateLimitService
    ) {
        this(authService, sessionService, userDetailsService, rateLimitService, null, null);
    }

    // ---- Registration ----

    @PostMapping("/register")
    @Operation(summary = "Register a new customer account")
    public ResponseEntity<ApiResponse<AuthDTO.UserSummary>> register(
            @Valid @RequestBody AuthDTO.RegisterRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.REGISTER, getClientIp(httpRequest));

        AuthDTO.UserSummary user = authService.register(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created successfully", user));
    }

    // ---- CSRF Token Distribution ----

    @GetMapping("/csrf")
    @Operation(summary = "Generate and fetch CSRF token for web clients")
    public ResponseEntity<ApiResponse<Map<String, String>>> getCsrfToken(
            HttpServletRequest httpRequest, HttpServletResponse httpResponse) {

        String csrfToken = cookieService != null ? cookieService.generateCsrfToken() : "mock-csrf-token";
        if (cookieService != null) {
            cookieService.attachCsrfCookie(httpRequest, httpResponse, csrfToken);
        }
        return ResponseEntity.ok(ApiResponse.success("CSRF token generated", Map.of("csrfToken", csrfToken)));
    }

    // ---- Login ----

    @PostMapping("/login")
    @Operation(summary = "Login with email/mobile and password")
    public ResponseEntity<ApiResponse<AuthDTO.Response>> login(
            @Valid @RequestBody AuthDTO.LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        rateLimitService.checkLimit(RateLimitService.LOGIN, getClientIp(httpRequest));

        AuthDTO.Response authResponse = authService.login(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        if (cookieService != null && !cookieService.isMobileClient(httpRequest)) {
            cookieService.attachRefreshCookie(httpRequest, httpResponse, authResponse.refreshToken(),
                    jwtService != null ? jwtService.getRefreshTokenExpirationSeconds() : 604800L);
            String csrf = cookieService.generateCsrfToken();
            cookieService.attachCsrfCookie(httpRequest, httpResponse, csrf);
            authResponse = AuthDTO.Response.of(authResponse.accessToken(), null, authResponse.expiresIn(), authResponse.user());
        }

        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    // ---- POS Counter Fast PIN Login ----

    @PostMapping("/pos/pin-login")
    @Operation(summary = "Fast POS terminal counter login with 4-digit PIN for store cashiers")
    public ResponseEntity<ApiResponse<AuthDTO.Response>> posPinLogin(
            @Valid @RequestBody AuthDTO.PosPinLoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        rateLimitService.checkLimit(RateLimitService.LOGIN, getClientIp(httpRequest));

        AuthDTO.Response authResponse = authService.posPinLogin(
                request,
                getClientIp(httpRequest),
                httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest)
        );

        if (cookieService != null && !cookieService.isMobileClient(httpRequest)) {
            cookieService.attachRefreshCookie(httpRequest, httpResponse, authResponse.refreshToken(),
                    jwtService != null ? jwtService.getRefreshTokenExpirationSeconds() : 604800L);
            String csrf = cookieService.generateCsrfToken();
            cookieService.attachCsrfCookie(httpRequest, httpResponse, csrf);
            authResponse = AuthDTO.Response.of(authResponse.accessToken(), null, authResponse.expiresIn(), authResponse.user());
        }

        return ResponseEntity.ok(ApiResponse.success("POS login successful", authResponse));
    }

    // ---- Phone OTP Authentication ----

    @PostMapping("/otp/request")
    @Operation(summary = "Request OTP for phone without leaking account existence")
    public ResponseEntity<ApiResponse<OtpDTO.ChallengeResponse>> requestOtp(
            @Valid @RequestBody OtpDTO.RequestChallenge request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.RESEND, getClientIp(httpRequest));

        OtpDTO.ChallengeResponse response = authService.requestOtp(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("If the account is eligible, an OTP has been sent", response));
    }

    @PostMapping("/otp/send")
    @Operation(summary = "Send OTP to mobile phone number for passwordless login/registration")
    public ResponseEntity<ApiResponse<OtpDTO.SendResponse>> sendOtp(
            @Valid @RequestBody OtpDTO.SendPhoneRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.RESEND, getClientIp(httpRequest));

        OtpDTO.SendResponse response = authService.sendPhoneOtp(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.ok(ApiResponse.success(response.message(), response));
    }

    @PostMapping("/otp/verify")
    @Operation(summary = "Verify phone OTP and authenticate (returns JWT access & refresh tokens)")
    public ResponseEntity<ApiResponse<AuthDTO.Response>> verifyOtp(
            @Valid @RequestBody OtpDTO.VerifyPhoneRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        rateLimitService.checkLimit(RateLimitService.OTP_VERIFY, getClientIp(httpRequest));

        AuthDTO.Response authResponse;
        if (request.otpRequestId() != null && !request.otpRequestId().isBlank()) {
            authResponse = authService.verifyOtpWithRequestId(
                    new OtpDTO.VerifyChallengeRequest(request.phone(), request.otpRequestId(), request.otp(), request.deviceId()),
                    getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                    getRequestId(httpRequest));
        } else {
            authResponse = authService.verifyPhoneOtp(request,
                    getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                    getRequestId(httpRequest));
        }

        if (cookieService != null && !cookieService.isMobileClient(httpRequest)) {
            cookieService.attachRefreshCookie(httpRequest, httpResponse, authResponse.refreshToken(),
                    jwtService != null ? jwtService.getRefreshTokenExpirationSeconds() : 604800L);
            String csrf = cookieService.generateCsrfToken();
            cookieService.attachCsrfCookie(httpRequest, httpResponse, csrf);
            authResponse = AuthDTO.Response.of(authResponse.accessToken(), null, authResponse.expiresIn(), authResponse.user());
        }

        return ResponseEntity.ok(ApiResponse.success("Authentication successful", authResponse));
    }

    // ---- Token Refresh ----

    @PostMapping({"/refresh", "/token/refresh"})
    @Operation(summary = "Rotate refresh token and issue new access token")
    public ResponseEntity<ApiResponse<AuthDTO.Response>> refresh(
            @RequestBody(required = false) SessionDTO.RefreshTokenRequest request,
            @CookieValue(name = CookieService.REFRESH_COOKIE_NAME, required = false) String cookieRefreshToken,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        rateLimitService.checkLimit(RateLimitService.REFRESH, getClientIp(httpRequest));

        String rawToken = (cookieRefreshToken != null && !cookieRefreshToken.isBlank())
                ? cookieRefreshToken
                : (request != null ? request.refreshToken() : null);

        if (rawToken == null || rawToken.isBlank()) {
            throw AuthException.refreshTokenInvalid();
        }

        SessionDTO.RefreshTokenRequest effectiveRequest = new SessionDTO.RefreshTokenRequest(rawToken);
        AuthDTO.Response authResponse = authService.refreshToken(effectiveRequest,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        boolean isWeb = (cookieService != null && !cookieService.isMobileClient(httpRequest))
                || (cookieRefreshToken != null && !cookieRefreshToken.isBlank());

        if (isWeb && cookieService != null) {
            cookieService.attachRefreshCookie(httpRequest, httpResponse, authResponse.refreshToken(),
                    jwtService != null ? jwtService.getRefreshTokenExpirationSeconds() : 604800L);
            String csrf = cookieService.generateCsrfToken();
            cookieService.attachCsrfCookie(httpRequest, httpResponse, csrf);
            authResponse = AuthDTO.Response.of(authResponse.accessToken(), null, authResponse.expiresIn(), authResponse.user());
        }

        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", authResponse));
    }

    // ---- Current User ----

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<AuthDTO.UserSummary>> me(
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userDetailsService.loadUserEntityById(UUID.fromString(userDetails.getUsername()));
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", authService.buildEnrichedUserSummary(user)));
    }

    // ---- Logout ----

    @PostMapping("/logout")
    @Operation(summary = "Logout current session", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) AuthDTO.LogoutRequest logoutRequest,
            @RequestParam(required = false) String sessionId,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (userDetails != null) {
            try {
                var user = userDetailsService.loadUserEntityById(UUID.fromString(userDetails.getUsername()));
                String effectiveSessionId = (logoutRequest != null && logoutRequest.sessionId() != null)
                        ? logoutRequest.sessionId()
                        : sessionId;

                authService.logout(user, effectiveSessionId,
                        getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                        getRequestId(httpRequest));
            } catch (Exception ignored) {
                // If token expired or user cannot be loaded, still proceed to clear cookies
            }
        }

        if (cookieService != null) {
            cookieService.clearRefreshCookie(httpRequest, httpResponse);
        }

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout-all")
    @Operation(summary = "Logout from all devices", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> logoutAll(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {

        var user = userDetailsService.loadUserEntityById(UUID.fromString(userDetails.getUsername()));
        authService.logoutAll(user,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.ok(ApiResponse.success("Logged out from all devices successfully"));
    }

    // ---- Change Password ----

    @PostMapping("/change-password")
    @Operation(summary = "Change password for authenticated user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AuthDTO.ChangePasswordRequest request,
            HttpServletRequest httpRequest) {

        var user = userDetailsService.loadUserEntityById(UUID.fromString(userDetails.getUsername()));
        authService.changePassword(user, request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.ok(ApiResponse.success("Password changed successfully. Please log in again."));
    }

    // ---- Forgot / Reset Password ----

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset OTP (rate limited)")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody AuthDTO.ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.FORGOT_PWD, getClientIp(httpRequest));

        authService.forgotPassword(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        // Generic response — never reveal whether account exists or leak OTP
        return ResponseEntity.ok(ApiResponse.success("If the account exists, reset instructions have been sent."));
    }

    @PostMapping("/verify-reset-otp")
    @Operation(summary = "Verify password reset OTP")
    public ResponseEntity<ApiResponse<OtpDTO.VerifyResetPasswordResponse>> verifyResetOtp(
            @Valid @RequestBody OtpDTO.VerifyResetPasswordRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.OTP_VERIFY, getClientIp(httpRequest));

        String resetToken = authService.verifyResetOtp(request);
        return ResponseEntity.ok(ApiResponse.success(
                "OTP verified. Use the reset token to set a new password.",
                new OtpDTO.VerifyResetPasswordResponse(resetToken)));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Set new password using verified reset token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody AuthDTO.ResetPasswordRequest request,
            HttpServletRequest httpRequest) {

        authService.resetPassword(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.ok(ApiResponse.success("Password reset successful. Please log in with your new password."));
    }

    // ---- Email / Mobile Verification (stubs) ----

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email with OTP", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> verifyEmail(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody OtpDTO.VerifyRequest request) {

        var user = userDetailsService.loadUserEntityById(UUID.fromString(userDetails.getUsername()));
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully"));
    }

    @PostMapping("/resend-email-verification")
    @Operation(summary = "Resend email verification OTP", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> resendEmailVerification(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.RESEND, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success(
                "If your email is not yet verified, a new OTP has been sent."));
    }

    @PostMapping("/verify-mobile")
    @Operation(summary = "Verify mobile with OTP", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> verifyMobile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody OtpDTO.VerifyRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Mobile number verified successfully"));
    }

    @PostMapping("/resend-mobile-otp")
    @Operation(summary = "Resend mobile verification OTP", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> resendMobileOtp(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.RESEND, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success(
                "If your mobile is registered, a new OTP has been sent."));
    }

    // ---- Session Management ----

    @GetMapping("/sessions")
    @Operation(summary = "List active sessions", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<SessionDTO.Response>>> getSessions(
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userDetailsService.loadUserEntityById(UUID.fromString(userDetails.getUsername()));
        List<SessionDTO.Response> sessions = sessionService.getActiveSessions(user);
        return ResponseEntity.ok(ApiResponse.success("Sessions retrieved", sessions));
    }

    @DeleteMapping("/sessions/{sessionId}")
    @Operation(summary = "Revoke a specific session", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> revokeSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID sessionId) {

        var user = userDetailsService.loadUserEntityById(UUID.fromString(userDetails.getUsername()));
        sessionService.revokeSession(user, sessionId);
        return ResponseEntity.ok(ApiResponse.success("Session revoked successfully"));
    }

    // ---- Team Invitation Onboarding ----

    @GetMapping("/invite/verify")
    @Operation(summary = "Verify one-time staff invitation link")
    public ResponseEntity<ApiResponse<com.superapp.user.dto.StaffDTO.VerifyInviteResponse>> verifyInvite(
            @RequestParam("token") String token) {
        if (userService == null) {
            throw new IllegalStateException("User service is not available");
        }
        var response = userService.verifyInviteToken(token);
        return ResponseEntity.ok(ApiResponse.success("Invitation is valid", response));
    }

    @PostMapping("/invite/accept")
    @Operation(summary = "Accept team invitation, establish credentials, and activate account")
    public ResponseEntity<ApiResponse<com.superapp.user.dto.StaffDTO.Response>> acceptInvite(
            @Valid @RequestBody com.superapp.user.dto.StaffDTO.AcceptInviteRequest request) {
        if (userService == null) {
            throw new IllegalStateException("User service is not available");
        }
        var response = userService.acceptInvite(request.token(), request.password());
        return ResponseEntity.ok(ApiResponse.success("Account activated successfully. You may now log in.", response));
    }

    // ---- Helpers ----

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String getRequestId(HttpServletRequest request) {
        return request.getHeader("X-Request-ID");
    }
}
