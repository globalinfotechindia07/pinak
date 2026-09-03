package com.example.auth.service;

import com.example.auth.dto.AuthResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.RefreshTokenRequest;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.dto.UserResponse;
import com.example.auth.entity.Role;
import com.example.auth.entity.User;
import com.example.auth.exception.DuplicateResourceException;
import com.example.auth.exception.ResourceNotFoundException;
import com.example.auth.repository.UserRepository;
import com.example.auth.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service encapsulating authentication operations: registration, login, and token refresh.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    /**
     * Registers a new user account with default ROLE_USER.
     *
     * @param request registration details
     * @return safe UserResponse DTO
     * @throws DuplicateResourceException if email is already in use
     */
    @Transactional
    public UserResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        log.info("Attempting user registration for email: {}", normalizedEmail);

        // 1. Verify email uniqueness
        if (userRepository.existsByEmail(normalizedEmail)) {
            log.warn("Registration rejected: Email already exists: {}", normalizedEmail);
            throw new DuplicateResourceException("An account with email " + request.email() + " already exists");
        }

        // 2. Hash password with BCrypt
        String encodedPassword = passwordEncoder.encode(request.password());

        // 3. Create user entity with default Role.USER
        User user = new User(
                normalizedEmail,
                encodedPassword,
                request.firstName().trim(),
                request.lastName().trim(),
                Role.USER
        );

        // 4. Persist to PostgreSQL
        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {} and Role: {}", savedUser.getId(), savedUser.getRole());

        // 5. Return safe DTO
        return UserResponse.fromEntity(savedUser);
    }

    /**
     * Authenticates credentials and returns signed JWT access and refresh tokens.
     *
     * @param request login credentials
     * @return AuthResponse containing access token, refresh token, and access expiry
     */
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        log.info("Authenticating login attempt for user: {}", normalizedEmail);

        // 1. Delegate authentication to Spring Security's AuthenticationManager
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        normalizedEmail,
                        request.password()
                )
        );

        // 2. Fetch authenticated user details
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));

        // 3. Generate signed Access Token and Refresh Token
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        log.info("Authentication successful for user: {} (Role: {}). Access and refresh tokens issued.", normalizedEmail, user.getRole());

        // 4. Return token response
        return AuthResponse.of(accessToken, refreshToken, jwtService.getAccessTokenExpirationInSeconds());
    }

    /**
     * Validates a refresh token and issues a new access token and rotated refresh token.
     *
     * @param request containing the refresh token string
     * @return AuthResponse containing new access and refresh tokens
     * @throws BadCredentialsException if the token is invalid, expired, or not a refresh token
     */
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.refreshToken();
        log.debug("Processing token refresh request");

        // 1. Verify token is a valid, unexpired REFRESH token
        if (!jwtService.isRefreshToken(token)) {
            log.warn("Token refresh failed: Provided token is invalid or expired");
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        // 2. Extract user email from token subject
        String email = jwtService.extractUsername(token);
        if (email == null) {
            log.warn("Token refresh failed: Missing subject claim");
            throw new BadCredentialsException("Refresh token does not contain a valid subject");
        }

        // 3. Fetch user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        // 4. Issue fresh Access Token and rotated Refresh Token
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        log.info("Token successfully refreshed for user: {}", email);
        return AuthResponse.of(newAccessToken, newRefreshToken, jwtService.getAccessTokenExpirationInSeconds());
    }
}
