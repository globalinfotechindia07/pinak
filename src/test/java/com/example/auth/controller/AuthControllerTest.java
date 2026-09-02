package com.example.auth.controller;

import com.example.auth.dto.AuthResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.dto.UserResponse;
import com.example.auth.entity.Role;
import com.example.auth.exception.DuplicateResourceException;
import com.example.auth.exception.GlobalExceptionHandler;
import com.example.auth.security.CustomUserDetailsService;
import com.example.auth.security.JwtService;
import com.example.auth.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters to test Controller & Validation layer in isolation
@Import(GlobalExceptionHandler.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("POST /api/v1/auth/register - 201 Created on valid input")
    void shouldRegisterSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest("john.doe@example.com", "Password123!", "John", "Doe");
        UserResponse response = new UserResponse(UUID.randomUUID(), "john.doe@example.com", "John", "Doe", Role.USER, LocalDateTime.now());

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("john.doe@example.com"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - 400 Bad Request on invalid email format")
    void shouldReturn400OnInvalidEmail() throws Exception {
        RegisterRequest request = new RegisterRequest("invalid-email-format", "Password123!", "John", "Doe");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.validationErrors.email").exists());
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - 400 Bad Request on weak/short password")
    void shouldReturn400OnShortPassword() throws Exception {
        RegisterRequest request = new RegisterRequest("valid@example.com", "123", "John", "Doe");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.password").exists());
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - 409 Conflict when email is already registered")
    void shouldReturn409OnDuplicateEmail() throws Exception {
        RegisterRequest request = new RegisterRequest("duplicate@example.com", "Password123!", "John", "Doe");

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new DuplicateResourceException("An account with email duplicate@example.com already exists"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("An account with email duplicate@example.com already exists"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - 200 OK on valid credentials")
    void shouldLoginSuccessfully() throws Exception {
        LoginRequest request = new LoginRequest("john.doe@example.com", "Password123!");
        AuthResponse response = AuthResponse.bearer("mocked.jwt.token", 900L);

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("mocked.jwt.token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - 401 Unauthorized on invalid credentials")
    void shouldReturn401OnInvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest("john.doe@example.com", "WrongPassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }
}
