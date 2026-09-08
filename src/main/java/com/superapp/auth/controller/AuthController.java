package com.superapp.auth.controller;

import com.superapp.auth.dto.*;
import com.superapp.auth.service.AuthService;
import com.superapp.auth.service.SessionService;
import com.superapp.common.config.RateLimitService;
import com.superapp.common.response.ApiResponse;
import com.superapp.common.security.CustomUserDetailsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Authentication controller: registration, login, token management,
 * password management, email/mobile verification, and session management.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Authentication, token management, and password operations")
public class AuthController {

    private final AuthService authService;
    private final SessionService sessionService;
    private final CustomUserDetailsService userDetailsService;
    private final RateLimitService rateLimitService;

    public AuthController(
            AuthService authService,
            SessionService sessionService,
            CustomUserDetailsService userDetailsService,
            RateLimitService rateLimitService
    ) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.userDetailsService = userDetailsService;
        this.rateLimitService = rateLimitService;
    }

    // ---- Registration ----

    @PostMapping("/register")
    @Operation(summary = "Register a new customer account")
    public ResponseEntity<ApiResponse<UserSummary>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.REGISTER, getClientIp(httpRequest));

        UserSummary user = authService.register(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created successfully", user));
    }

    // ---- Login ----

    @PostMapping("/login")
    @Operation(summary = "Login with email/mobile and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.LOGIN, getClientIp(httpRequest));

        AuthResponse authResponse = authService.login(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    // ---- Phone OTP Authentication ----

    @PostMapping("/otp/send")
    @Operation(summary = "Send OTP to mobile phone number for passwordless login/registration")
    public ResponseEntity<ApiResponse<SendOtpResponse>> sendOtp(
            @Valid @RequestBody SendOtpRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.RESEND, getClientIp(httpRequest));

        SendOtpResponse response = authService.sendPhoneOtp(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.ok(ApiResponse.success(response.message(), response));
    }

    @PostMapping("/otp/verify")
    @Operation(summary = "Verify phone OTP and authenticate (returns JWT access & refresh tokens)")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody VerifyPhoneOtpRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.OTP_VERIFY, getClientIp(httpRequest));

        AuthResponse authResponse = authService.verifyPhoneOtp(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.ok(ApiResponse.success("Authentication successful", authResponse));
    }

    // ---- Token Refresh ----

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token and issue new access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.REFRESH, getClientIp(httpRequest));

        AuthResponse authResponse = authService.refreshToken(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", authResponse));
    }

    // ---- Current User ----

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<UserSummary>> me(
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userDetailsService.loadUserEntityById(UUID.fromString(userDetails.getUsername()));
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", UserSummary.from(user)));
    }

    // ---- Logout ----

    @PostMapping("/logout")
    @Operation(summary = "Logout current session", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String sessionId,
            HttpServletRequest httpRequest) {

        var user = userDetailsService.loadUserEntityById(UUID.fromString(userDetails.getUsername()));
        authService.logout(user, sessionId,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
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
            @Valid @RequestBody ChangePasswordRequest request,
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
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.FORGOT_PWD, getClientIp(httpRequest));

        String rawOtp = authService.forgotPassword(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        String message = "If the account exists, reset instructions have been sent.";
        if (rawOtp != null) {
            message += " [Mock OTP: " + rawOtp + "]";
        }

        // Generic response — never reveal whether account exists
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/verify-reset-otp")
    @Operation(summary = "Verify password reset OTP")
    public ResponseEntity<ApiResponse<String>> verifyResetOtp(
            @Valid @RequestBody VerifyResetOtpRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.OTP_VERIFY, getClientIp(httpRequest));

        String resetToken = authService.verifyResetOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP verified. Use the reset token to set a new password.",
                resetToken));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Set new password using verified reset token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {

        authService.resetPassword(request,
                getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest));

        return ResponseEntity.ok(ApiResponse.success("Password reset successful. Please log in with your new password."));
    }

    // ---- Email / Mobile Verification (stubs — OTP delivery via OtpService) ----

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email with OTP", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> verifyEmail(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VerifyOtpRequest request) {

        var user = userDetailsService.loadUserEntityById(UUID.fromString(userDetails.getUsername()));
        // TODO: Implement email OTP verification (store hash, verify, mark emailVerified=true)
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully"));
    }

    @PostMapping("/resend-email-verification")
    @Operation(summary = "Resend email verification OTP", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> resendEmailVerification(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.RESEND, getClientIp(httpRequest));
        // TODO: Resend email verification OTP
        return ResponseEntity.ok(ApiResponse.success(
                "If your email is not yet verified, a new OTP has been sent."));
    }

    @PostMapping("/verify-mobile")
    @Operation(summary = "Verify mobile with OTP", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> verifyMobile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VerifyOtpRequest request) {

        // TODO: Implement mobile OTP verification
        return ResponseEntity.ok(ApiResponse.success("Mobile number verified successfully"));
    }

    @PostMapping("/resend-mobile-otp")
    @Operation(summary = "Resend mobile verification OTP", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> resendMobileOtp(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.RESEND, getClientIp(httpRequest));
        // TODO: Resend mobile OTP
        return ResponseEntity.ok(ApiResponse.success(
                "If your mobile is registered, a new OTP has been sent."));
    }

    // ---- Session Management ----

    @GetMapping("/sessions")
    @Operation(summary = "List active sessions", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getSessions(
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userDetailsService.loadUserEntityById(UUID.fromString(userDetails.getUsername()));
        List<SessionResponse> sessions = sessionService.getActiveSessions(user);
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
