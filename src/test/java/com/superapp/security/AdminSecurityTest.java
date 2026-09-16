package com.superapp.security;

import com.superapp.auth.dto.RegisterRequest;
import com.superapp.auth.repository.PasswordResetTokenRepository;
import com.superapp.auth.service.*;
import com.superapp.category.controller.AdminCategoryController;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.common.security.JwtService;
import com.superapp.location.controller.AdminCityController;
import com.superapp.offer.controller.AdminOfferController;
import com.superapp.transaction.redemption.controller.AdminRedemptionController;
import com.superapp.transaction.reward.controller.AdminRewardController;
import com.superapp.user.controller.AdminController;
import com.superapp.user.controller.AdminDashboardController;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminSecurityTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock TokenService tokenService;
    @Mock SessionService sessionService;
    @Mock PasswordResetService passwordResetService;
    @Mock AuditService auditService;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock OtpService otpService;
    @Mock OtpStorageService otpStorageService;

    @InjectMocks AuthService authService;

    @Nested
    @DisplayName("Privilege Escalation Prevention")
    class PrivilegeEscalationTests {

        @Test
        @DisplayName("Register with Role.ADMIN throws 403 Forbidden")
        void registerWithAdminRole_throwsForbidden() {
            var request = new RegisterRequest("Admin", "Hacker", "admin@evil.com", null, "StrongPass@1", null, Role.ADMIN);
            when(userRepository.existsByEmail("admin@evil.com")).thenReturn(false);

            assertThatThrownBy(() -> authService.register(request, "127.0.0.1", "curl", "req-1"))
                    .isInstanceOf(AppException.class)
                    .satisfies(ex -> {
                        AppException appEx = (AppException) ex;
                        assertThat(appEx.getHttpStatus()).isEqualTo(403);
                        assertThat(appEx.getErrorCode()).isEqualTo(ApiError.FORBIDDEN);
                    });
        }

        @Test
        @DisplayName("Register with Role.SUPER_ADMIN throws 403 Forbidden")
        void registerWithSuperAdminRole_throwsForbidden() {
            var request = new RegisterRequest("Super", "Hacker", "super@evil.com", null, "StrongPass@1", null, Role.SUPER_ADMIN);
            when(userRepository.existsByEmail("super@evil.com")).thenReturn(false);

            assertThatThrownBy(() -> authService.register(request, "127.0.0.1", "curl", "req-2"))
                    .isInstanceOf(AppException.class)
                    .satisfies(ex -> {
                        AppException appEx = (AppException) ex;
                        assertThat(appEx.getHttpStatus()).isEqualTo(403);
                        assertThat(appEx.getErrorCode()).isEqualTo(ApiError.FORBIDDEN);
                    });
        }

        @Test
        @DisplayName("Register with Role.MERCHANT or default CUSTOMER succeeds")
        void registerWithAllowedRoles_succeeds() {
            var reqMerchant = new RegisterRequest("Merchant", "Owner", "merchant@biz.com", null, "StrongPass@1", null, Role.MERCHANT);
            when(userRepository.existsByEmail("merchant@biz.com")).thenReturn(false);
            when(passwordEncoder.encode("StrongPass@1")).thenReturn("$2a$12$hash");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(UUID.randomUUID());
                return u;
            });

            var result = authService.register(reqMerchant, "127.0.0.1", "curl", "req-3");
            assertThat(result).isNotNull();
            assertThat(result.email()).isEqualTo("merchant@biz.com");
            assertThat(result.role()).isEqualTo("MERCHANT");
        }
    }

    @Nested
    @DisplayName("Admin Controller Security Annotations Double Enforcement")
    class AdminControllerSecurityAnnotationsTest {

        @Test
        @DisplayName("All Admin Controllers must have class-level PreAuthorize for ADMIN roles")
        void verifyAdminControllersHavePreAuthorize() {
            Class<?>[] adminControllers = {
                    AdminController.class,
                    AdminDashboardController.class,
                    AdminCategoryController.class,
                    AdminCityController.class,
                    AdminOfferController.class,
                    AdminRedemptionController.class,
                    AdminRewardController.class
            };

            for (Class<?> clazz : adminControllers) {
                PreAuthorize preAuth = clazz.getAnnotation(PreAuthorize.class);
                assertThat(preAuth)
                        .withFailMessage("Class %s must have @PreAuthorize annotation", clazz.getSimpleName())
                        .isNotNull();

                String expression = preAuth.value();
                assertThat(expression)
                        .withFailMessage("Class %s @PreAuthorize must check for ADMIN or SUPER_ADMIN but was '%s'", clazz.getSimpleName(), expression)
                        .matches(s -> s.contains("ADMIN") || s.contains("SUPER_ADMIN"));
            }
        }
    }
}
