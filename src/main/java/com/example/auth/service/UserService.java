package com.example.auth.service;

import com.example.auth.dto.UserResponse;
import com.example.auth.entity.User;
import com.example.auth.exception.ResourceNotFoundException;
import com.example.auth.repository.UserRepository;
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
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
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
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return UserResponse.fromEntity(user);
    }

    /**
     * Retrieves all registered users in the system.
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
     * Updates the profile information (first name, last name) of a user by email.
     *
     * @param email user email
     * @param request updated profile data
     * @return updated safe UserResponse DTO
     */
    @Transactional
    public UserResponse updateProfile(String email, com.example.auth.dto.UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());

        User updatedUser = userRepository.save(user);
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
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cannot delete: User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }
}
