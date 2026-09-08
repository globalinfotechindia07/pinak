package com.superapp.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.common.security.CustomUserDetailsService;
import com.superapp.user.dto.UserResponse;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerUnitTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock UserService userService;
    @Mock CustomUserDetailsService userDetailsService;

    @InjectMocks UserController userController;

    private static final String USER_ID = "11111111-1111-1111-1111-111111111111";

    @BeforeEach
    void setUp() {
        // Resolve @AuthenticationPrincipal UserDetails in standalone MockMvc
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User(USER_ID, "password", Collections.emptyList());
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/users/me — returns authenticated user profile")
    void getMyProfile_success() throws Exception {
        UUID userId = UUID.fromString(USER_ID);
        var userResponse = new UserResponse(
                userId.toString(), "Customer Test", "Customer", "Test",
                "cust@example.com", "+919876543210", Role.CUSTOMER.name(), UserStatus.ACTIVE.name(),
                true, true, "https://example.com/avatar.jpg", Instant.now(), Instant.now()
        );

        when(userService.getMyProfile(eq(userId))).thenReturn(userResponse);

        mockMvc.perform(get("/api/v1/users/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("cust@example.com"))
                .andExpect(jsonPath("$.data.profilePictureUrl").value("https://example.com/avatar.jpg"))
                .andExpect(jsonPath("$.data.role").value("CUSTOMER"));
    }

    @Test
    @DisplayName("GET /api/v1/users/customer-area — accessible with customer user")
    void customerArea_success() throws Exception {
        mockMvc.perform(get("/api/v1/users/customer-area"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.containsString("Welcome Customer!")));
    }

    @Test
    @DisplayName("GET /api/v1/users/merchant-area — accessible with merchant user")
    void merchantArea_success() throws Exception {
        mockMvc.perform(get("/api/v1/users/merchant-area"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.containsString("Welcome Merchant!")));
    }

    @Test
    @DisplayName("GET /api/v1/users/admin-area — accessible with admin user")
    void adminArea_success() throws Exception {
        mockMvc.perform(get("/api/v1/users/admin-area"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.containsString("Welcome Admin!")));
    }
}
