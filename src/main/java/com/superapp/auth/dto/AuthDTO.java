package com.superapp.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.superapp.common.validation.PasswordPolicy;
import com.superapp.common.validation.PasswordsMatch;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Consolidated Authentication Data Transfer Objects (Single File Architecture)
 * Encapsulates: Credentials, Login, Registration, MFA, Password Management, and User Summary.
 */
public class AuthDTO {

    /**
     * User summary returned in authentication responses.
     * Enriched with Multi-Tier Staff (Platform, Merchant, Store) and Scoped Permissions.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserSummary(
            String id,
            String name,
            String email,
            String mobile,
            String role,
            String status,
            boolean emailVerified,
            boolean mobileVerified,
            String profilePictureUrl,
            String staffScope,
            String staffRoleId,
            String staffRoleName,
            UUID merchantId,
            UUID storeId,
            String permissions
    ) {
        public static UserSummary from(User user) {
            return new UserSummary(
                    user.getId() != null ? user.getId().toString() : null,
                    user.getName(),
                    user.getEmail(),
                    user.getMobile(),
                    user.getRole() != null ? user.getRole().name() : null,
                    user.getStatus() != null ? user.getStatus().name() : null,
                    user.isEmailVerified(),
                    user.isMobileVerified(),
                    user.getProfilePictureUrl(),
                    null, null, null, null, null, null
            );
        }

        public static UserSummary from(User user, String staffScope, String staffRoleId,
                                       String staffRoleName, UUID merchantId, UUID storeId, String permissions) {
            return new UserSummary(
                    user.getId() != null ? user.getId().toString() : null,
                    user.getName(),
                    user.getEmail(),
                    user.getMobile(),
                    user.getRole() != null ? user.getRole().name() : null,
                    user.getStatus() != null ? user.getStatus().name() : null,
                    user.isEmailVerified(),
                    user.isMobileVerified(),
                    user.getProfilePictureUrl(),
                    staffScope, staffRoleId, staffRoleName, merchantId, storeId, permissions
            );
        }

        // Backward-compatible constructor
        public UserSummary(String id, String name, String email, String mobile,
                           String role, String status, boolean emailVerified, boolean mobileVerified,
                           String profilePictureUrl) {
            this(id, name, email, mobile, role, status, emailVerified, mobileVerified, profilePictureUrl,
                    null, null, null, null, null, null);
        }

        public UserSummary(String id, String name, String email, String mobile,
                           String role, String status, boolean emailVerified, boolean mobileVerified) {
            this(id, name, email, mobile, role, status, emailVerified, mobileVerified, null);
        }
    }

    /**
     * Auth response containing tokens and enriched user summary.
     */
    public record Response(
            String accessToken,
            String tokenType,
            long expiresIn,
            String refreshToken,
            UserSummary user
    ) {
        public static Response of(String accessToken, String refreshToken, long expiresIn, UserSummary user) {
            return new Response(accessToken, "Bearer", expiresIn, refreshToken, user);
        }
    }

    /**
     * General login request supporting email, mobile phone, or identifier.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LoginRequest(
            @NotBlank(message = "Identifier (email or mobile) is required")
            @Size(max = 255, message = "Identifier must not exceed 255 characters")
            @Schema(description = "User email or phone/mobile number", example = "customer@superapp.com")
            String identifier,

            @NotBlank(message = "Password is required")
            @Size(max = 128, message = "Password must not exceed 128 characters")
            @Schema(description = "Account password", example = "Password@123")
            String password,

            @Size(max = 255, message = "Device ID must not exceed 255 characters")
            @Schema(description = "Optional client device ID for session tracking", example = "device-001")
            String deviceId,

            @Size(max = 255, message = "Device name must not exceed 255 characters")
            @Schema(description = "Optional client device name", example = "Pixel 8 Pro")
            String deviceName
    ) {
        @JsonCreator
        public static LoginRequest fromJson(
                @JsonProperty("identifier") String identifier,
                @JsonProperty("email") String email,
                @JsonProperty("phone") String phone,
                @JsonProperty("mobile") String mobile,
                @JsonProperty("phoneNumber") String phoneNumber,
                @JsonProperty("password") String password,
                @JsonProperty("deviceId") String deviceId,
                @JsonProperty("deviceName") String deviceName
        ) {
            String resolved = identifier;
            if (resolved == null || resolved.isBlank()) {
                if (email != null && !email.isBlank()) {
                    resolved = email;
                } else if (phone != null && !phone.isBlank()) {
                    resolved = phone;
                } else if (mobile != null && !mobile.isBlank()) {
                    resolved = mobile;
                } else if (phoneNumber != null && !phoneNumber.isBlank()) {
                    resolved = phoneNumber;
                }
            }
            return new LoginRequest(
                    resolved != null ? resolved.trim() : null,
                    password,
                    deviceId,
                    deviceName
            );
        }

        public LoginRequest(String identifier, String password) {
            this(identifier, password, null, null);
        }
    }

    /**
     * User registration request.
     */
    public record RegisterRequest(
            @NotBlank(message = "First name is required")
            @Size(max = 100, message = "First name must not exceed 100 characters")
            String firstName,

            @NotBlank(message = "Last name is required")
            @Size(max = 100, message = "Last name must not exceed 100 characters")
            String lastName,

            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            @Size(max = 255, message = "Email must not exceed 255 characters")
            String email,

            @Size(min = 7, max = 20, message = "Mobile number must be between 7 and 20 characters")
            @Pattern(regexp = "^[+]?[0-9]{7,20}$", message = "Invalid mobile number format")
            String mobile,

            @NotBlank(message = "Password is required")
            @PasswordPolicy
            String password,

            @Schema(description = "Confirmation password (must match password)", example = "Password@123")
            String confirmPassword,

            @Schema(description = "Profile picture URL (optional)", example = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400")
            @Size(max = 1024, message = "Profile picture URL must not exceed 1024 characters")
            String profilePictureUrl,

            @Schema(description = "Account role (defaults to CUSTOMER if omitted)", example = "CUSTOMER")
            Role role
    ) {
        public RegisterRequest(String firstName, String lastName, String email, String mobile, String password) {
            this(firstName, lastName, email, mobile, password, password, null, null);
        }

        public RegisterRequest(String firstName, String lastName, String email, String mobile, String password, String profilePictureUrl) {
            this(firstName, lastName, email, mobile, password, password, profilePictureUrl, null);
        }

        public RegisterRequest(String firstName, String lastName, String email, String mobile, String password, String profilePictureUrl, Role role) {
            this(firstName, lastName, email, mobile, password, password, profilePictureUrl, role);
        }
    }

    /**
     * Admin login request initiating two-factor challenge.
     */
    public record AdminLoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "Password is required")
            String password,

            String deviceId
    ) {}

    /**
     * Response containing MFA challenge session ID.
     */
    public record AdminMfaChallengeResponse(
            boolean mfaRequired,
            String challengeId
    ) {}

    /**
     * Request verifying Admin 6-digit MFA code.
     */
    public record AdminMfaVerifyRequest(
            @NotBlank(message = "Challenge ID is required")
            String challengeId,

            @NotBlank(message = "MFA code is required")
            @Pattern(regexp = "^[0-9]{6}$", message = "MFA code must be 6 digits")
            String code,

            String deviceId
    ) {}

    /**
     * Fast Store POS Counter Terminal login via 4-digit PIN.
     */
    public record PosPinLoginRequest(
            @NotNull(message = "Store ID is required")
            UUID storeId,

            @NotBlank(message = "Phone number is required")
            String phone,

            @NotBlank(message = "4-digit POS PIN is required")
            @Pattern(regexp = "^[0-9]{4,6}$", message = "POS PIN must be 4 to 6 digits")
            String posPin,

            String deviceId,
            String deviceName
    ) {}

    /**
     * Change password request with confirmation validation.
     */
    @PasswordsMatch(
            field = "newPassword",
            matchField = "confirmNewPassword",
            message = "New password and confirmation password do not match"
    )
    public record ChangePasswordRequest(
            @NotBlank(message = "Current password is required")
            @Size(max = 128, message = "Password must not exceed 128 characters")
            String currentPassword,

            @NotBlank(message = "New password is required")
            @PasswordPolicy
            String newPassword,

            @NotBlank(message = "Please confirm your new password")
            @Size(max = 128, message = "Password must not exceed 128 characters")
            String confirmNewPassword
    ) {}

    /**
     * Request to initiate password reset via OTP.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ForgotPasswordRequest(
            @NotBlank(message = "Identifier (email or mobile) is required")
            @Size(max = 255, message = "Identifier must not exceed 255 characters")
            String identifier
    ) {
        @JsonCreator
        public static ForgotPasswordRequest fromJson(
                @JsonProperty("identifier") String identifier,
                @JsonProperty("email") String email,
                @JsonProperty("phone") String phone,
                @JsonProperty("mobile") String mobile,
                @JsonProperty("phoneNumber") String phoneNumber
        ) {
            String resolved = identifier;
            if (resolved == null || resolved.isBlank()) {
                if (email != null && !email.isBlank()) {
                    resolved = email;
                } else if (phone != null && !phone.isBlank()) {
                    resolved = phone;
                } else if (mobile != null && !mobile.isBlank()) {
                    resolved = mobile;
                } else if (phoneNumber != null && !phoneNumber.isBlank()) {
                    resolved = phoneNumber;
                }
            }
            return new ForgotPasswordRequest(resolved != null ? resolved.trim() : null);
        }
    }

    /**
     * Request to verify password reset OTP.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record VerifyResetOtpRequest(
            @NotBlank(message = "Identifier (email or mobile) is required")
            String identifier,

            @NotBlank(message = "OTP is required")
            String otp
    ) {
        @JsonCreator
        public static VerifyResetOtpRequest fromJson(
                @JsonProperty("identifier") String identifier,
                @JsonProperty("email") String email,
                @JsonProperty("phone") String phone,
                @JsonProperty("mobile") String mobile,
                @JsonProperty("otp") String otp
        ) {
            String resolved = identifier;
            if (resolved == null || resolved.isBlank()) {
                if (email != null && !email.isBlank()) {
                    resolved = email;
                } else if (phone != null && !phone.isBlank()) {
                    resolved = phone;
                } else if (mobile != null && !mobile.isBlank()) {
                    resolved = mobile;
                }
            }
            return new VerifyResetOtpRequest(resolved != null ? resolved.trim() : null, otp);
        }
    }

    /**
     * Final password reset execution using verified token.
     */
    public record ResetPasswordRequest(
            @NotBlank(message = "Reset token is required")
            String resetToken,

            @NotBlank(message = "New password is required")
            @PasswordPolicy
            String newPassword
    ) {}

    /**
     * Session logout request.
     */
    public record LogoutRequest(
            String sessionId
    ) {}
}
