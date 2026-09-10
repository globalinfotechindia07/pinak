package com.superapp.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.auth.service.SessionService;
import com.superapp.common.exception.ForbiddenException;
import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.exception.UserSuspendedException;
import com.superapp.common.security.CustomUserDetailsService;
import com.superapp.user.dto.UpdateProfileRequest;
import com.superapp.user.dto.UserResponse;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.Instant;
import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UserControllerSecurityTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private UserService userService;

    @Mock
    private SessionService sessionService;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @InjectMocks
    private UserController userController;

    private static final String AUTHENTICATED_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    private static final String ATTACKER_TARGET_USER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    @BeforeEach
    void setUp() {
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User(AUTHENTICATED_USER_ID, "password", Collections.emptyList());
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();
    }

    @Nested
    @DisplayName("IDOR & Authentication Isolation Tests")
    class IdorTests {

        @Test
        @DisplayName("GET /api/v1/users/me always resolves authenticated user and ignores query or body parameters")
        void getMyProfile_usesAuthenticatedContext_notInjectedId() throws Exception {
            UUID authId = UUID.fromString(AUTHENTICATED_USER_ID);
            var response = new UserResponse(
                    authId.toString(), "+919876543210", "rohan@example.com", "Rohan", "User",
                    Role.CUSTOMER.name(), UserStatus.ACTIVE.name(), true, "Rohan User",
                    "+919876543210", true, true, null, Instant.now(), Instant.now()
            );

            when(userService.getMyProfile(authId)).thenReturn(response);

            mockMvc.perform(get("/api/v1/users/me")
                            .param("userId", ATTACKER_TARGET_USER_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("User fetched successfully"))
                    .andExpect(jsonPath("$.data.id").value(authId.toString()))
                    .andExpect(jsonPath("$.data.phone").value("+919876543210"))
                    .andExpect(jsonPath("$.data.profileCompleted").value(true));

            verify(userService).getMyProfile(eq(authId));
            verify(userService, never()).getMyProfile(eq(UUID.fromString(ATTACKER_TARGET_USER_ID)));
        }

        @Test
        @DisplayName("PUT /api/v1/users/me ignores mass-assignment fields (role, status, phone, profileCompleted)")
        void updateMyProfile_preventsMassAssignment() throws Exception {
            UUID authId = UUID.fromString(AUTHENTICATED_USER_ID);
            var response = new UserResponse(
                    authId.toString(), "+919876543210", "rohan@example.com", "Rohan", "Itankar",
                    Role.CUSTOMER.name(), UserStatus.ACTIVE.name(), true, "Rohan Itankar",
                    "+919876543210", true, true, null, Instant.now(), Instant.now()
            );

            ArgumentCaptor<UpdateProfileRequest> requestCaptor = ArgumentCaptor.forClass(UpdateProfileRequest.class);
            when(userService.updateMyProfile(eq(authId), requestCaptor.capture())).thenReturn(response);

            // Attempting mass-assignment payload with malicious role, status, phone override
            String maliciousPayload = """
                    {
                      "firstName": "Rohan",
                      "lastName": "Itankar",
                      "email": "rohan@example.com",
                      "role": "ADMIN",
                      "status": "ACTIVE",
                      "phone": "+911111111111",
                      "profileCompleted": false
                    }
                    """;

            mockMvc.perform(put("/api/v1/users/me")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(maliciousPayload))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Profile updated successfully"))
                    .andExpect(jsonPath("$.data.role").value("CUSTOMER"))
                    .andExpect(jsonPath("$.data.phone").value("+919876543210"));

            UpdateProfileRequest captured = requestCaptor.getValue();
            assertThat(captured.firstName()).isEqualTo("Rohan");
            assertThat(captured.lastName()).isEqualTo("Itankar");
            assertThat(captured.email()).isEqualTo("rohan@example.com");
        }
    }

    @Nested
    @DisplayName("Session Ownership Security Tests")
    class SessionSecurityTests {

        @Test
        @DisplayName("DELETE /api/v1/users/me/sessions/{sessionId} returns 403 Forbidden when session belongs to another user")
        void revokeSession_forbiddenWhenBelongingToAnotherUser() throws Exception {
            UUID authId = UUID.fromString(AUTHENTICATED_USER_ID);
            UUID victimSessionId = UUID.randomUUID();

            doThrow(new ForbiddenException("You do not have permission to revoke this session"))
                    .when(sessionService).revokeSessionForUser(authId, victimSessionId);

            mockMvc.perform(delete("/api/v1/users/me/sessions/{sessionId}", victimSessionId))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
        }

        @Test
        @DisplayName("DELETE /api/v1/users/me/sessions/{sessionId} returns 404 Not Found when session does not exist")
        void revokeSession_notFound() throws Exception {
            UUID authId = UUID.fromString(AUTHENTICATED_USER_ID);
            UUID nonExistentSessionId = UUID.randomUUID();

            doThrow(ResourceNotFoundException.session(nonExistentSessionId.toString()))
                    .when(sessionService).revokeSessionForUser(authId, nonExistentSessionId);

            mockMvc.perform(delete("/api/v1/users/me/sessions/{sessionId}", nonExistentSessionId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("SESSION_NOT_FOUND"));
        }

        @Test
        @DisplayName("DELETE /api/v1/users/me/sessions/{sessionId} returns 204 No Content on successful session revocation")
        void revokeSession_success() throws Exception {
            UUID authId = UUID.fromString(AUTHENTICATED_USER_ID);
            UUID validSessionId = UUID.randomUUID();

            doNothing().when(sessionService).revokeSessionForUser(authId, validSessionId);

            mockMvc.perform(delete("/api/v1/users/me/sessions/{sessionId}", validSessionId))
                    .andExpect(status().isNoContent());

            verify(sessionService).revokeSessionForUser(authId, validSessionId);
        }
    }

    @Nested
    @DisplayName("Suspended User & Error Handling Tests")
    class ErrorHandlingTests {

        @Test
        @DisplayName("GET /api/v1/users/me returns 403 and USER_SUSPENDED when user is suspended")
        void getMyProfile_suspendedUser_returns403() throws Exception {
            UUID authId = UUID.fromString(AUTHENTICATED_USER_ID);
            when(userService.getMyProfile(authId)).thenThrow(new UserSuspendedException());

            mockMvc.perform(get("/api/v1/users/me"))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value("User account is suspended"))
                    .andExpect(jsonPath("$.error.code").value("USER_SUSPENDED"));
        }

        @Test
        @DisplayName("PUT /api/v1/users/me returns 400 Bad Request with field details when email is invalid")
        void updateMyProfile_invalidEmail_returns400WithDetails() throws Exception {
            String invalidRequest = """
                    {
                      "firstName": "Rohan",
                      "lastName": "Itankar",
                      "email": "invalid-email-address"
                    }
                    """;

            mockMvc.perform(put("/api/v1/users/me")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidRequest))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                    .andExpect(jsonPath("$.error.details[0].field").value("email"));
        }
    }
}
