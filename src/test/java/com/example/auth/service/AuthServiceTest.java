package com.example.auth.service;

import com.example.auth.dto.AuthResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.RefreshTokenRequest;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.dto.UserResponse;
import com.example.auth.entity.Role;
import com.example.auth.entity.User;
import com.example.auth.exception.DuplicateResourceException;
import com.example.auth.repository.UserRepository;
import com.example.auth.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService, authenticationManager);
    }

    @Test
    @DisplayName("Register: Should successfully register a new user with hashed password and ROLE_USER")
    void shouldRegisterNewUserSuccessfully() {
        RegisterRequest request = new RegisterRequest("john@example.com", "Password123!", "John", "Doe");

        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("hashedBCryptPassword");

        User savedUser = new User("john@example.com", "hashedBCryptPassword", "John", "Doe", Role.USER);
        savedUser.setId(UUID.randomUUID());
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("john@example.com", response.email());
        assertEquals("John", response.firstName());
        assertEquals("Doe", response.lastName());
        assertEquals(Role.USER, response.role());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User capturedUser = userCaptor.getValue();
        assertEquals("john@example.com", capturedUser.getEmail());
        assertEquals("hashedBCryptPassword", capturedUser.getPassword());
        assertEquals(Role.USER, capturedUser.getRole());
    }

    @Test
    @DisplayName("Register: Should throw DuplicateResourceException when email already exists")
    void shouldThrowExceptionWhenRegisteringDuplicateEmail() {
        RegisterRequest request = new RegisterRequest("existing@example.com", "Password123!", "Jane", "Doe");
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("already exists"));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Login: Should successfully authenticate and return Access and Refresh tokens")
    void shouldLoginSuccessfully() {
        LoginRequest request = new LoginRequest("john@example.com", "Password123!");

        User user = new User("john@example.com", "hashedBCryptPassword", "John", "Doe", Role.USER);
        user.setId(UUID.randomUUID());

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(user)).thenReturn("mock.access.token");
        when(jwtService.generateRefreshToken(user)).thenReturn("mock.refresh.token");
        when(jwtService.getAccessTokenExpirationInSeconds()).thenReturn(900L);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock.access.token", response.accessToken());
        assertEquals("mock.refresh.token", response.refreshToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals(900L, response.expiresIn());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("Login: Should propagate BadCredentialsException when credentials are invalid")
    void shouldPropagateExceptionOnInvalidCredentials() {
        LoginRequest request = new LoginRequest("john@example.com", "WrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
        verify(jwtService, never()).generateAccessToken(any(User.class));
    }

    @Test
    @DisplayName("Refresh: Should successfully issue new access and rotated refresh tokens")
    void shouldRefreshTokenSuccessfully() {
        RefreshTokenRequest request = new RefreshTokenRequest("valid.refresh.token");
        User user = new User("john@example.com", "hashedBCryptPassword", "John", "Doe", Role.USER);
        user.setId(UUID.randomUUID());

        when(jwtService.isRefreshToken("valid.refresh.token")).thenReturn(true);
        when(jwtService.extractUsername("valid.refresh.token")).thenReturn("john@example.com");
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(user)).thenReturn("new.access.token");
        when(jwtService.generateRefreshToken(user)).thenReturn("new.rotated.refresh.token");
        when(jwtService.getAccessTokenExpirationInSeconds()).thenReturn(900L);

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new.access.token", response.accessToken());
        assertEquals("new.rotated.refresh.token", response.refreshToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals(900L, response.expiresIn());
    }

    @Test
    @DisplayName("Refresh: Should throw BadCredentialsException when refresh token is invalid or expired")
    void shouldThrowBadCredentialsWhenRefreshTokenIsInvalid() {
        RefreshTokenRequest request = new RefreshTokenRequest("invalid.token");
        when(jwtService.isRefreshToken("invalid.token")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.refreshToken(request));
        verify(userRepository, never()).findByEmail(any());
    }
}
