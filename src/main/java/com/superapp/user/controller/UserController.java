package com.superapp.user.controller;

import com.superapp.auth.dto.SessionResponse;
import com.superapp.auth.service.SessionService;
import com.superapp.common.response.ApiResponse;
import com.superapp.common.security.CustomUserDetailsService;
import com.superapp.user.dto.UpdateProfileRequest;
import com.superapp.user.dto.UserResponse;
import com.superapp.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * User self-service profile management and session management.
 * IDOR protection: all operations use the authenticated user ID from SecurityContext.
 */
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Profile", description = "Self-service user profile and session management")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final SessionService sessionService;
    private final CustomUserDetailsService userDetailsService;

    public UserController(UserService userService, SessionService sessionService, CustomUserDetailsService userDetailsService) {
        this.userService = userService;
        this.sessionService = sessionService;
        this.userDetailsService = userDetailsService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get own profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        UserResponse response = userService.getMyProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", response));
    }

    @PutMapping("/me")
    @Operation(summary = "Update own profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {

        // IDOR protection: always use authenticated user ID — never a path variable
        UUID userId = UUID.fromString(userDetails.getUsername());
        UserResponse response = userService.updateMyProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @GetMapping("/me/sessions")
    @Operation(summary = "List active sessions for current user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getMySessions(
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        List<SessionResponse> sessions = sessionService.getActiveSessions(userId);
        return ResponseEntity.ok(ApiResponse.success("Sessions retrieved", sessions));
    }

    @DeleteMapping("/me/sessions/{sessionId}")
    @Operation(summary = "Revoke specific session for current user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> revokeMySession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID sessionId) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        sessionService.revokeSessionForUser(userId, sessionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/customer-area")
    @Operation(summary = "Customer role verification endpoint", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<String>> customerOnlyArea(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Success", "Welcome Customer! User ID: " + userDetails.getUsername()));
    }

    @GetMapping("/merchant-area")
    @Operation(summary = "Merchant role verification endpoint", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MERCHANT', 'VENDOR')")
    public ResponseEntity<ApiResponse<String>> merchantOnlyArea(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Success", "Welcome Merchant! User ID: " + userDetails.getUsername()));
    }

    @GetMapping("/admin-area")
    @Operation(summary = "Admin role verification endpoint", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> adminOnlyArea(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Success", "Welcome Admin! User ID: " + userDetails.getUsername()));
    }
}
