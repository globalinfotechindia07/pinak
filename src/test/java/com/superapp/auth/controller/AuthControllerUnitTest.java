package com.superapp.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.auth.dto.AuthResponse;
import com.superapp.auth.dto.SendOtpRequest;
import com.superapp.auth.dto.SendOtpResponse;
import com.superapp.auth.dto.UserSummary;
import com.superapp.auth.dto.VerifyPhoneOtpRequest;
import com.superapp.auth.service.AuthService;
import com.superapp.auth.service.SessionService;
import com.superapp.common.config.RateLimitService;
import com.superapp.common.security.CustomUserDetailsService;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.UserStatus;
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

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerUnitTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock AuthService authService;
    @Mock SessionService sessionService;
    @Mock CustomUserDetailsService userDetailsService;
    @Mock RateLimitService rateLimitService;

    @InjectMocks AuthController authController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    @DisplayName("POST /api/v1/auth/otp/send — successfully sends OTP")
    void sendOtp_success() throws Exception {
        var request = new SendOtpRequest("+919876543210");
        var response = new SendOtpResponse("+919876543210", 300, 60, "OTP sent successfully");

        when(authService.sendPhoneOtp(any(), any(), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.phone").value("+919876543210"))
                .andExpect(jsonPath("$.data.expiresInSeconds").value(300))
                .andExpect(jsonPath("$.data.cooldownSeconds").value(60));
    }

    @Test
    @DisplayName("POST /api/v1/auth/otp/request — successfully returns 202 Accepted")
    void requestOtp_accepted() throws Exception {
        var request = new com.superapp.auth.dto.OtpRequestDto("+919876543210", "LOGIN", "dev-1");
        var response = new com.superapp.auth.dto.OtpRequestResponse("otp_req_123", 300);

        when(authService.requestOtp(any(), any(), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/otp/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("If the account is eligible, an OTP has been sent"))
                .andExpect(jsonPath("$.data.otpRequestId").value("otp_req_123"))
                .andExpect(jsonPath("$.data.expiresIn").value(300));
    }

    @Test
    @DisplayName("POST /api/v1/auth/otp/verify — successfully verifies OTP with otpRequestId")
    void verifyOtp_withOtpRequestId_success() throws Exception {
        var request = new VerifyPhoneOtpRequest("+919876543210", "otp_req_123", "123456", "device-1", "Pixel");
        var userSummary = new UserSummary(
                UUID.randomUUID().toString(), "Customer 3210", "cust@example.com",
                "+919876543210", Role.CUSTOMER.name(), UserStatus.ACTIVE.name(), true, true
        );
        var authResponse = AuthResponse.of("access-jwt-token", "refresh-jwt-token", 900L, userSummary);

        when(authService.verifyOtpWithRequestId(any(), any(), any(), any())).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("access-jwt-token"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/otp/verify — successfully verifies OTP and returns JWT tokens")
    void verifyOtp_success() throws Exception {
        var request = new VerifyPhoneOtpRequest("+919876543210", "123456", "device-1", "Pixel");
        var userSummary = new UserSummary(
                UUID.randomUUID().toString(), "Customer 3210", "cust@example.com",
                "+919876543210", Role.CUSTOMER.name(), UserStatus.ACTIVE.name(), true, true
        );
        var authResponse = AuthResponse.of("access-jwt-token", "refresh-jwt-token", 900L, userSummary);

        when(authService.verifyPhoneOtp(any(), any(), any(), any())).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("access-jwt-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("refresh-jwt-token"))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.role").value("CUSTOMER"));
    }
}
