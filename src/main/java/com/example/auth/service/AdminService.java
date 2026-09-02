package com.example.auth.service;

import com.example.auth.dto.AdminDashboardStats;
import com.example.auth.dto.UserResponse;
import com.example.auth.entity.Role;
import com.example.auth.entity.User;
import com.example.auth.exception.ResourceNotFoundException;
import com.example.auth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service encapsulating administrative logic for the Admin Panel.
 */
@Service
public class AdminService {

    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Computes dashboard statistics: total user count, role breakdown, and recent signups.
     *
     * @return AdminDashboardStats DTO
     */
    @Transactional(readOnly = true)
    public AdminDashboardStats getDashboardStats() {
        long totalUsers = userRepository.count();
        long adminCount = userRepository.countByRole(Role.ADMIN);
        long userCount = userRepository.countByRole(Role.USER);

        List<UserResponse> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(UserResponse::fromEntity)
                .toList();

        return new AdminDashboardStats(totalUsers, adminCount, userCount, recentUsers);
    }

    /**
     * Updates the role of a user (e.g. promoting USER to ADMIN or vice-versa).
     *
     * @param id user UUID
     * @param newRole target Role (USER or ADMIN)
     * @return updated UserResponse DTO
     * @throws ResourceNotFoundException if user does not exist
     */
    @Transactional
    public UserResponse updateUserRole(UUID id, Role newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);

        return UserResponse.fromEntity(updatedUser);
    }

    /**
     * Retrieves all users in the system.
     *
     * @return list of UserResponse DTOs
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    /**
     * Deletes a user by UUID.
     *
     * @param id user UUID
     * @throws ResourceNotFoundException if user does not exist
     */
    @Transactional
    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cannot delete: User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }
}
