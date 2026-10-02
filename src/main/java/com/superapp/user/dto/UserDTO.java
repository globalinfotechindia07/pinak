package com.superapp.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.common.validation.PasswordPolicy;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.validation.ValidName;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.time.Instant;

/**
 * Consolidated User Data Transfer Objects (Single File per Table Architecture)
 */
public class UserDTO {

    /**
     * Safe external representation of a User profile.
     * Never exposes password hashes or internal security tokens.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Response(
            String id,
            String phone,
            String email,
            String firstName,
            String lastName,
            String role,
            String status,
            boolean profileCompleted,
            String name,
            String mobile,
            Boolean emailVerified,
            Boolean mobileVerified,
            String profilePictureUrl,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static Response from(User user) {
            if (user == null) return null;
            return new Response(
                    user.getId() != null ? user.getId().toString() : null,
                    user.getPhone(),
                    user.getEmail(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getRole() != null ? user.getRole().name() : null,
                    user.getStatus() != null ? user.getStatus().name() : null,
                    user.isProfileCompleted(),
                    user.getName(),
                    user.getMobile(),
                    user.isEmailVerified(),
                    user.isMobileVerified(),
                    user.getProfilePictureUrl(),
                    user.getCreatedAt(),
                    user.getUpdatedAt()
            );
        }

        public Response(String id, String name, String firstName, String lastName,
                        String email, String mobile, String role, String status,
                        boolean emailVerified, boolean mobileVerified,
                        String profilePictureUrl, Instant createdAt, Instant updatedAt) {
            this(id, mobile, email, firstName, lastName, role, status,
                    (firstName != null && !firstName.isBlank() && lastName != null && !lastName.isBlank() && email != null && !email.isBlank()),
                    name, mobile, emailVerified, mobileVerified, profilePictureUrl, createdAt, updatedAt);
        }

        public Response(String id, String name, String firstName, String lastName,
                        String email, String mobile, String role, String status,
                        boolean emailVerified, boolean mobileVerified,
                        Instant createdAt, Instant updatedAt) {
            this(id, name, firstName, lastName, email, mobile, role, status,
                    emailVerified, mobileVerified, null, createdAt, updatedAt);
        }
    }

    /**
     * Request body for Admin user creation.
     */
    @Schema(description = "Request body for Admin user creation")
    public record CreateRequest(
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

            @NotNull(message = "Role is required")
            @Schema(description = "User role", example = "MERCHANT")
            Role role,

            @Schema(description = "Profile picture URL (optional)", example = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400")
            @Size(max = 1024, message = "Profile picture URL must not exceed 1024 characters")
            String profilePictureUrl
    ) {}

    /**
     * Request body for updating authenticated user profile.
     */
    public record UpdateProfileRequest(
            @Size(max = 100, message = "First name must not exceed 100 characters")
            @ValidName(message = "First name contains invalid characters")
            @Schema(description = "First name (optional)", example = "Jane")
            String firstName,

            @Size(max = 100, message = "Last name must not exceed 100 characters")
            @ValidName(message = "Last name contains invalid characters")
            @Schema(description = "Last name (optional)", example = "Doe")
            String lastName,

            @Email(message = "Invalid email address")
            @Size(max = 255, message = "Email must not exceed 255 characters")
            @Schema(description = "Email address (optional)", example = "jane.doe@example.com")
            String email,

            @Pattern(regexp = "^[+]?[0-9]{7,20}$", message = "Invalid mobile number format")
            @Size(min = 7, max = 20, message = "Mobile number must be between 7 and 20 characters")
            @Schema(description = "Mobile / phone number (optional)", example = "+919876543210")
            String mobile,

            @Size(max = 1024, message = "Profile picture URL must not exceed 1024 characters")
            @Schema(description = "Profile picture URL (optional)", example = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400")
            String profilePictureUrl
    ) {
        public UpdateProfileRequest(String firstName, String lastName, String email) {
            this(firstName, lastName, email, null, null);
        }

        public UpdateProfileRequest(String firstName, String lastName, String email, String mobile) {
            this(firstName, lastName, email, mobile, null);
        }
    }

    /**
     * Request body for updating user role.
     */
    public record UpdateRoleRequest(
            @NotNull(message = "Role is required")
            Role role
    ) {}

    /**
     * Request body for updating user account status (ACTIVE, INACTIVE, SUSPENDED, BLOCKED).
     */
    public record UpdateStatusRequest(
            @NotNull(message = "Status is required")
            UserStatus status,
            String reason
    ) {
        public UpdateStatusRequest(UserStatus status) {
            this(status, null);
        }
    }

    /**
     * Response summary for Admin dashboard metrics.
     */
    public record AdminDashboardSummaryResponse(
            UserMetrics users,
            MerchantMetrics merchants,
            StoreMetrics stores,
            OfferMetrics offers,
            TransactionMetrics transactions,
            Instant timestamp
    ) {
        public record UserMetrics(long total, long active, long inactive) {}
        public record MerchantMetrics(long total, long pendingApproval, long active, long suspended) {}
        public record StoreMetrics(long total, long pendingApproval, long active) {}
        public record OfferMetrics(long total, long pendingApproval, long active, long expired) {}
        public record TransactionMetrics(long total, long successful, long pending, long failed, long refunded) {}
    }
}
