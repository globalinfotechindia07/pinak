package com.example.auth.service;

import com.example.auth.dto.AuthResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.dto.UserResponse;
import com.example.auth.entity.Role;
import com.example.auth.entity.User;
import com.example.auth.exception.DuplicateResourceException;
import com.example.auth.exception.ResourceNotFoundException;
import com.example.auth.repository.UserRepository;
import com.example.auth.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service encapsulating authentication operations: registration and login.
 */
@Service
public class AuthService {

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

        // 1. Verify email uniqueness
        if (userRepository.existsByEmail(normalizedEmail)) {
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

        // 5. Return safe DTO
        return UserResponse.fromEntity(savedUser);
    }

    /**
     * Authenticates credentials and returns a signed JWT access token.
     *
     * @param request login credentials
     * @return AuthResponse containing access token and expiry
     */
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        // 1. Delegate authentication to Spring Security's AuthenticationManager
        // This invokes CustomUserDetailsService and verifies the password hash using BCrypt
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        normalizedEmail,
                        request.password()
                )
        );

        // 2. Fetch authenticated user details
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));

        // 3. Generate signed JWT token
        String jwtToken = jwtService.generateToken(user);

        // 4. Return token response
        return AuthResponse.bearer(jwtToken, jwtService.getExpirationInSeconds());
    }
}
