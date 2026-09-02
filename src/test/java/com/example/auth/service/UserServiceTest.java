package com.example.auth.service;

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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository);
    }

    @Test
    @DisplayName("Should return user by ID when user exists")
    void shouldReturnUserById() {
        UUID id = UUID.randomUUID();
        User user = new User("test@example.com", "hash", "First", "Last", Role.USER);
        user.setId(id);

        when(userRepository.findById(id)).thenReturn(Optional.of(user));

        UserResponse response = userService.getUserById(id);

        assertNotNull(response);
        assertEquals(id, response.id());
        assertEquals("test@example.com", response.email());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when user ID does not exist")
    void shouldThrowExceptionWhenUserNotFoundById() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getUserById(id));
    }

    @Test
    @DisplayName("Should return all users")
    void shouldReturnAllUsers() {
        User u1 = new User("u1@example.com", "h1", "U1", "L1", Role.USER);
        u1.setId(UUID.randomUUID());
        User u2 = new User("u2@example.com", "h2", "U2", "L2", Role.ADMIN);
        u2.setId(UUID.randomUUID());

        when(userRepository.findAll()).thenReturn(List.of(u1, u2));

        List<UserResponse> list = userService.getAllUsers();

        assertEquals(2, list.size());
        assertEquals("u1@example.com", list.get(0).email());
        assertEquals("u2@example.com", list.get(1).email());
    }

    @Test
    @DisplayName("Should delete user when ID exists")
    void shouldDeleteUserWhenIdExists() {
        UUID id = UUID.randomUUID();
        when(userRepository.existsById(id)).thenReturn(true);

        userService.deleteUser(id);

        verify(userRepository).deleteById(id);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when deleting non-existent user ID")
    void shouldThrowWhenDeletingNonExistentUser() {
        UUID id = UUID.randomUUID();
        when(userRepository.existsById(id)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> userService.deleteUser(id));
        verify(userRepository, never()).deleteById(any(UUID.class));
    }
}
