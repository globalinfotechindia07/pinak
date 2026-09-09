package com.superapp.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.auth.dto.*;
import com.superapp.auth.service.AuthService;
import com.superapp.common.config.RateLimitService;
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
class AdminAuthControllerUnitTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock AuthService authService;
    @Mock RateLimitService rateLimitService;

    @InjectMocks AdminAuthController adminAuthController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminAuthController).build();
    }

    @Test
    @DisplayName("POST /api/v1/admin/auth/login — returns MFA challenge")
    void adminLogin_success() throws Exception {
        var request = new AdminLoginRequest("admin@superapp.com", "Password@123", "device-admin");
        var response = new AdminMfaChallengeResponse(true, "mfa_challenge_abc");

        when(authService.adminLogin(any(), any(), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.mfaRequired").value(true))
                .andExpect(jsonPath("$.data.challengeId").value("mfa_challenge_abc"));
    }

    @Test
    @DisplayName("POST /api/v1/admin/auth/mfa/verify — returns Admin JWT tokens")
    void adminVerifyMfa_success() throws Exception {
        var request = new AdminMfaVerifyRequest("mfa_challenge_abc", "123456", "device-admin");
        var userSummary = new UserSummary(
                UUID.randomUUID().toString(), "Admin Master", "admin@superapp.com",
                null, Role.ADMIN.name(), UserStatus.ACTIVE.name(), true, false
        );
        var authResponse = AuthResponse.of("admin-jwt", "admin-refresh", 900L, userSummary);

        when(authService.adminVerifyMfa(any(), any(), any(), any())).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/admin/auth/mfa/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("admin-jwt"))
                .andExpect(jsonPath("$.data.user.role").value("ADMIN"));
    }
}
