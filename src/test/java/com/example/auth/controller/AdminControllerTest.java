package com.example.auth.controller;

import com.example.auth.dto.AdminDashboardStats;
import com.example.auth.dto.UpdateUserRoleRequest;
import com.example.auth.dto.UserResponse;
import com.example.auth.entity.Role;
import com.example.auth.exception.GlobalExceptionHandler;
import com.example.auth.security.CustomUserDetailsService;
import com.example.auth.security.JwtAuthenticationFilter;
import com.example.auth.security.JwtService;
import com.example.auth.security.SecurityConfig;
import com.example.auth.service.AdminService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminService adminService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private JwtService jwtService;

    @Test
    @DisplayName("GET /api/v1/admin/dashboard - 401 Unauthorized when unauthenticated")
    void shouldReturn401WhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @WithMockUser(username = "regular@example.com", roles = {"USER"})
    @DisplayName("GET /api/v1/admin/dashboard - 403 Forbidden when accessed by ROLE_USER")
    void shouldReturn403WhenUserAccessesAdminDashboard() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    @DisplayName("GET /api/v1/admin/dashboard - 200 OK when accessed by ROLE_ADMIN")
    void shouldReturnDashboardStatsForAdmin() throws Exception {
        AdminDashboardStats stats = new AdminDashboardStats(5, 1, 4, Collections.emptyList());
        when(adminService.getDashboardStats()).thenReturn(stats);

        mockMvc.perform(get("/api/v1/admin/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Admin dashboard metrics retrieved successfully"))
                .andExpect(jsonPath("$.data.totalUsers").value(5))
                .andExpect(jsonPath("$.data.adminCount").value(1))
                .andExpect(jsonPath("$.data.standardUserCount").value(4));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    @DisplayName("PATCH /api/v1/admin/users/{id}/role - 200 OK when role updated by Admin")
    void shouldAllowAdminToUpdateUserRole() throws Exception {
        UUID id = UUID.randomUUID();
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.ADMIN);
        UserResponse response = new UserResponse(id, "promoted@example.com", "John", "Doe", Role.ADMIN, LocalDateTime.now());

        when(adminService.updateUserRole(id, Role.ADMIN)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/admin/users/" + id + "/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("User role updated successfully"))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    @DisplayName("DELETE /api/v1/admin/users/{id} - 200 OK when deleted by Admin")
    void shouldAllowAdminToDeleteUser() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/admin/users/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("User permanently deleted successfully"));

        verify(adminService).deleteUser(id);
    }
}
