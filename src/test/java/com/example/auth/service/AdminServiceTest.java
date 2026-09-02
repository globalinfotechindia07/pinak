package com.example.auth.service;

import com.example.auth.dto.AdminDashboardStats;
import com.example.auth.dto.UserResponse;
import com.example.auth.entity.Role;
import com.example.auth.entity.User;
import com.example.auth.exception.ResourceNotFoundException;
import com.example.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(userRepository);
    }

    @Test
    @DisplayName("Should compute correct dashboard statistics")
    void shouldComputeDashboardStats() {
        when(userRepository.count()).thenReturn(10L);
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(2L);
        when(userRepository.countByRole(Role.USER)).thenReturn(8L);

        User u = new User("recent@example.com", "h", "Recent", "User", Role.USER);
        u.setId(UUID.randomUUID());
        when(userRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(List.of(u));

        AdminDashboardStats stats = adminService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(10L, stats.totalUsers());
        assertEquals(2L, stats.adminCount());
        assertEquals(8L, stats.standardUserCount());
        assertEquals(1, stats.recentUsers().size());
        assertEquals("recent@example.com", stats.recentUsers().get(0).email());
    }

    @Test
    @DisplayName("Should promote user from USER to ADMIN")
    void shouldPromoteUserRole() {
        UUID id = UUID.randomUUID();
        User user = new User("user@example.com", "h", "User", "One", Role.USER);
        user.setId(id);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserResponse response = adminService.updateUserRole(id, Role.ADMIN);

        assertNotNull(response);
        assertEquals(Role.ADMIN, response.role());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when updating role for non-existent user")
    void shouldThrowWhenUpdatingRoleForMissingUser() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> adminService.updateUserRole(id, Role.ADMIN));
    }

    @Test
    @DisplayName("Should delete user when ID exists")
    void shouldDeleteUser() {
        UUID id = UUID.randomUUID();
        when(userRepository.existsById(id)).thenReturn(true);

        adminService.deleteUser(id);

        verify(userRepository).deleteById(id);
    }
}
