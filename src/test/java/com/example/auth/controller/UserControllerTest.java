package com.example.auth.controller;

import com.example.auth.dto.UserResponse;
import com.example.auth.entity.Role;
import com.example.auth.exception.GlobalExceptionHandler;
import com.example.auth.security.CustomUserDetailsService;
import com.example.auth.security.JwtAuthenticationFilter;
import com.example.auth.security.JwtService;
import com.example.auth.security.SecurityConfig;
import com.example.auth.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private JwtService jwtService;

    @Test
    @DisplayName("GET /api/v1/users/me - 401 Unauthorized when not authenticated")
    void shouldReturn401WhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = {"USER"})
    @DisplayName("GET /api/v1/users/me - 200 OK when authenticated as ROLE_USER")
    void shouldReturnCurrentUserProfileWhenAuthenticated() throws Exception {
        UserResponse response = new UserResponse(
                UUID.randomUUID(),
                "user@example.com",
                "Regular",
                "User",
                Role.USER,
                LocalDateTime.now()
        );

        when(userService.getUserByEmail("user@example.com")).thenReturn(response);

        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.firstName").value("Regular"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = {"USER"})
    @DisplayName("GET /api/v1/users - 403 Forbidden when accessed by ROLE_USER")
    void shouldReturn403WhenUserAccessesAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    @DisplayName("GET /api/v1/users - 200 OK when accessed by ROLE_ADMIN")
    void shouldReturnAllUsersWhenAccessedByAdmin() throws Exception {
        UserResponse u1 = new UserResponse(UUID.randomUUID(), "a@example.com", "A", "A", Role.USER, LocalDateTime.now());
        UserResponse u2 = new UserResponse(UUID.randomUUID(), "b@example.com", "B", "B", Role.ADMIN, LocalDateTime.now());

        when(userService.getAllUsers()).thenReturn(List.of(u1, u2));

        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].email").value("a@example.com"))
                .andExpect(jsonPath("$[1].email").value("b@example.com"));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = {"USER"})
    @DisplayName("DELETE /api/v1/users/{id} - 403 Forbidden when attempted by ROLE_USER")
    void shouldDenyDeleteUserForRegularUser() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/users/" + id))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    @DisplayName("DELETE /api/v1/users/{id} - 204 No Content when executed by ROLE_ADMIN")
    void shouldAllowDeleteUserForAdmin() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/users/" + id))
                .andExpect(status().isNoContent());

        verify(userService).deleteUser(id);
    }
}
