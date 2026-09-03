package com.example.auth.service;

import com.example.auth.dto.UserResponse;
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
 * Service encapsulating business logic for User operations.
 * Coordinates between Controller and UserRepository.
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    // Constructor injection: Spring automatically injects the UserRepository bean
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Retrieves a user by their UUID.
     *
     * @param id user UUID
     * @return safe UserResponse DTO
     * @throws ResourceNotFoundException if user does not exist
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        log.debug("Fetching user by ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("User lookup failed: ID {} not found", id);
                    return new ResourceNotFoundException("User not found with id: " + id);
                });
        return UserResponse.fromEntity(user);
    }

    /**
     * Retrieves a user by their email address.
     *
     * @param email user email
     * @return safe UserResponse DTO
     * @throws ResourceNotFoundException if user does not exist
     */
    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) {
        log.debug("Fetching user profile by email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User lookup failed: Email {} not found", email);
                    return new ResourceNotFoundException("User not found with email: " + email);
                });
        return UserResponse.fromEntity(user);
    }

    /**
     * Retrieves all registered users in the system.
     *
     * @return list of UserResponse DTOs
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        log.debug("Fetching all registered users");
        return userRepository.findAll()
                .stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    /**
     * Updates the profile information (first name, last name) of a user by email.
     *
     * @param email user email
     * @param request updated profile data
     * @return updated safe UserResponse DTO
     */
    @Transactional
    public UserResponse updateProfile(String email, com.example.auth.dto.UpdateProfileRequest request) {
        log.info("Updating profile details for user: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Profile update failed: User {} not found", email);
                    return new ResourceNotFoundException("User not found with email: " + email);
                });

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());

        User updatedUser = userRepository.save(user);
        log.info("Profile updated successfully for user: {}", email);
        return UserResponse.fromEntity(updatedUser);
    }

    /**
     * Deletes a user by their UUID.
     *
     * @param id user UUID
     * @throws ResourceNotFoundException if user does not exist
     */
    @Transactional
    public void deleteUser(UUID id) {
        log.info("Deleting user with ID: {}", id);
        if (!userRepository.existsById(id)) {
            log.warn("Delete user failed: ID {} not found", id);
            throw new ResourceNotFoundException("Cannot delete: User not found with id: " + id);
        }
        userRepository.deleteById(id);
        log.info("User with ID: {} deleted successfully", id);
    }
}
