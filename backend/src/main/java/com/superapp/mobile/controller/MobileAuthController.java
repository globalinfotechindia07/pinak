package com.superapp.mobile.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.mobile.dto.MobileProfileSetupRequest;
import com.superapp.mobile.dto.MobileProfileSetupResponse;
import com.superapp.mobile.dto.MobileSendOtpRequest;
import com.superapp.mobile.dto.MobileSendOtpResponse;
import com.superapp.mobile.dto.MobileVerifyOtpRequest;
import com.superapp.mobile.dto.MobileVerifyOtpResponse;
import com.superapp.mobile.service.MobileAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/mobile/auth", "/api/v1/mobile/profile"})
@Tag(name = "Mobile App - Authentication", description = "PINAK Mobile OTP Authentication APIs")
public class MobileAuthController {

    private final MobileAuthService mobileAuthService;

    public MobileAuthController(MobileAuthService mobileAuthService) {
        this.mobileAuthService = mobileAuthService;
    }

    @PostMapping("/send-otp")
    @Operation(summary = "Send 6-Digit Mobile OTP", description = "Generates and delivers a 6-digit OTP code to the customer's phone via SMS or WhatsApp")
    public ResponseEntity<ApiResponse<MobileSendOtpResponse>> sendOtp(
            @Valid @RequestBody(required = false) MobileSendOtpRequest requestBody,
            @RequestParam(value = "phone", required = false) String phoneParam,
            @RequestParam(value = "channel", required = false, defaultValue = "SMS") String channelParam
    ) {
        String phone = (requestBody != null && requestBody.phone() != null && !requestBody.phone().isBlank())
                ? requestBody.phone()
                : phoneParam;
        String channel = (requestBody != null && requestBody.channel() != null && !requestBody.channel().isBlank())
                ? requestBody.channel()
                : channelParam;

        MobileSendOtpRequest request = (requestBody != null)
                ? requestBody
                : new MobileSendOtpRequest(phone, channel, true, false, null);

        MobileSendOtpResponse response = mobileAuthService.sendOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully", response));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend Mobile OTP", description = "Resends a new 6-digit OTP after the 60-second cooldown period")
    public ResponseEntity<ApiResponse<MobileSendOtpResponse>> resendOtp(
            @Valid @RequestBody(required = false) MobileSendOtpRequest requestBody,
            @RequestParam(value = "phone", required = false) String phoneParam,
            @RequestParam(value = "channel", required = false, defaultValue = "SMS") String channelParam
    ) {
        return sendOtp(requestBody, phoneParam, channelParam);
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Smart OTP Verification & Member Gateway", description = "Verifies 6-digit OTP code. Routes returning member directly to Home, or first-time user to Profile Setup")
    public ResponseEntity<ApiResponse<MobileVerifyOtpResponse>> verifyOtp(
            @Valid @RequestBody(required = false) MobileVerifyOtpRequest requestBody,
            @RequestParam(value = "phone", required = false) String phoneParam,
            @RequestParam(value = "otp", required = false) String otpParam,
            @RequestParam(value = "sessionId", required = false) String sessionIdParam,
            HttpServletRequest httpRequest
    ) {
        String phone = (requestBody != null && requestBody.phone() != null && !requestBody.phone().isBlank())
                ? requestBody.phone()
                : phoneParam;
        String otp = (requestBody != null && requestBody.otp() != null && !requestBody.otp().isBlank())
                ? requestBody.otp()
                : otpParam;
        String sessionId = (requestBody != null && requestBody.sessionId() != null && !requestBody.sessionId().isBlank())
                ? requestBody.sessionId()
                : sessionIdParam;

        MobileVerifyOtpRequest request = new MobileVerifyOtpRequest(phone, otp, sessionId);

        MobileVerifyOtpResponse response = mobileAuthService.verifyOtp(
                request,
                getClientIp(httpRequest),
                httpRequest != null ? httpRequest.getHeader("User-Agent") : "Mobile-Client",
                httpRequest != null ? httpRequest.getHeader("X-Request-ID") : null
        );

        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully", response));
    }

    @PostMapping("/complete-setup")
    @Operation(summary = "Complete Profile Setup (Screen 08)", description = "Completes profile setup for newly registered mobile users. Requires Bearer onboarding token in Authorization header.")
    public ResponseEntity<ApiResponse<MobileProfileSetupResponse>> completeProfileSetup(
            @Valid @RequestBody MobileProfileSetupRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest httpRequest
    ) {
        MobileProfileSetupResponse response = mobileAuthService.completeProfileSetup(
                request,
                authHeader,
                getClientIp(httpRequest),
                httpRequest != null ? httpRequest.getHeader("User-Agent") : "Mobile-Client"
        );
        return ResponseEntity.ok(ApiResponse.success("Profile setup completed successfully", response));
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
