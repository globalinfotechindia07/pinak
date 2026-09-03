package com.example.auth.service;

import com.example.auth.dto.AdminDashboardStats;
import com.example.auth.dto.UserResponse;
import com.example.auth.entity.Role;
import com.example.auth.entity.User;
import com.example.auth.exception.ResourceNotFoundException;
import com.example.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service encapsulating administrative logic for the Admin Panel.
 */
@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

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
        log.info("Calculating admin dashboard metrics");
        long totalUsers = userRepository.count();
        long adminCount = userRepository.countByRole(Role.ADMIN);
        long userCount = userRepository.countByRole(Role.USER);

        List<UserResponse> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(UserResponse::fromEntity)
                .toList();

        log.debug("Dashboard stats: total={}, admins={}, users={}", totalUsers, adminCount, userCount);
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
        log.info("Admin action: Changing role for user ID {} to {}", id, newRole);
        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Role update failed: User ID {} not found", id);
                    return new ResourceNotFoundException("User not found with id: " + id);
                });

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);
        log.info("Role successfully updated for user {} ({}) to {}", updatedUser.getEmail(), id, newRole);

        return UserResponse.fromEntity(updatedUser);
    }

    /**
     * Retrieves all users in the system.
     *
     * @return list of UserResponse DTOs
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        log.debug("Admin action: Retrieving all users list");
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
        log.info("Admin action: Deleting user ID {}", id);
        if (!userRepository.existsById(id)) {
            log.warn("Admin delete failed: User ID {} not found", id);
            throw new ResourceNotFoundException("Cannot delete: User not found with id: " + id);
        }
        userRepository.deleteById(id);
        log.info("User ID {} permanently deleted by admin", id);
    }
}
