package com.superapp.auth.controller;

import com.superapp.auth.dto.AdminLoginRequest;
import com.superapp.auth.dto.AdminMfaChallengeResponse;
import com.superapp.auth.dto.AdminMfaVerifyRequest;
import com.superapp.auth.dto.AuthResponse;
import com.superapp.auth.service.AuthService;
import com.superapp.common.config.RateLimitService;
import com.superapp.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin authentication controller: username/password login generating MFA challenge,
 * and MFA verification issuing privileged Admin JWT tokens.
 */
@RestController
@RequestMapping("/api/v1/admin/auth")
@Tag(name = "Admin Authentication", description = "Admin login and MFA challenge verification")
public class AdminAuthController {

    private final AuthService authService;
    private final RateLimitService rateLimitService;

    public AdminAuthController(AuthService authService, RateLimitService rateLimitService) {
        this.authService = authService;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping("/login")
    @Operation(summary = "Admin login requiring MFA challenge")
    public ResponseEntity<ApiResponse<AdminMfaChallengeResponse>> login(
            @Valid @RequestBody AdminLoginRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.LOGIN, getClientIp(httpRequest));

        AdminMfaChallengeResponse response = authService.adminLogin(
                request,
                getClientIp(httpRequest),
                httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest)
        );

        return ResponseEntity.ok(ApiResponse.success("MFA verification required", response));
    }

    @PostMapping("/mfa/verify")
    @Operation(summary = "Verify Admin MFA code and issue admin JWT tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyMfa(
            @Valid @RequestBody AdminMfaVerifyRequest request,
            HttpServletRequest httpRequest) {

        rateLimitService.checkLimit(RateLimitService.OTP_VERIFY, getClientIp(httpRequest));

        AuthResponse authResponse = authService.adminVerifyMfa(
                request,
                getClientIp(httpRequest),
                httpRequest.getHeader("User-Agent"),
                getRequestId(httpRequest)
        );

        return ResponseEntity.ok(ApiResponse.success("Admin authentication successful", authResponse));
    }

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
