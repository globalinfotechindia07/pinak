package com.example.auth.controller;

import com.example.auth.dto.AuthResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.RefreshTokenRequest;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.dto.SuccessResponse;
import com.example.auth.dto.UserResponse;
import com.example.auth.exception.ErrorResponse;
import com.example.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public Authentication REST Controller providing registration and login endpoints.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user registration and JWT authentication")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Registers a new user.
     *
     * @param request validated registration payload
     * @return 201 Created with SuccessResponse envelope containing UserResponse
     */
    @PostMapping("/register")
    @Operation(
            summary = "Register a new user account",
            description = "Creates a new user account with default ROLE_USER, securely hashes the password with BCrypt, and persists the record to PostgreSQL."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation failed (e.g. missing fields, invalid email format, short password)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Email is already registered",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<SuccessResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(SuccessResponse.created("User registered successfully", response));
    }

    /**
     * Authenticates user credentials and issues signed JWT access and refresh tokens.
     *
     * @param request validated login credentials
     * @return 200 OK with SuccessResponse containing AuthResponse
     */
    @PostMapping("/login")
    @Operation(
            summary = "Authenticate user credentials",
            description = "Authenticates user email and password against stored BCrypt hashes, issuing a signed short-lived JWT access token and a long-lived refresh token."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Login successful, tokens returned",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation failed on request body",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Invalid email or password",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<SuccessResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(SuccessResponse.ok("Authentication successful", response));
    }

    /**
     * Refreshes an expired access token using a valid, long-lived refresh token.
     *
     * @param request containing the refresh token
     * @return 200 OK with SuccessResponse containing new access token and rotated refresh token
     */
    @PostMapping("/refresh")
    @Operation(
            summary = "Refresh expired access token",
            description = "Validates the long-lived refresh token and returns a new 15-minute access token along with a rotated refresh token."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Tokens successfully refreshed",
                    content = @Content(schema = @Schema(implementation = SuccessResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation failed or invalid token format",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Refresh token expired or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<SuccessResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(SuccessResponse.ok("Token refreshed successfully", response));
    }
}
