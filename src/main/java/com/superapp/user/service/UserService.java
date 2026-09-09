package com.superapp.user.service;

import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.user.dto.UpdateProfileRequest;
import com.superapp.user.dto.UserResponse;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * User profile and admin management service.
 * <p>
 * IDOR / BOLA protection pattern:
 * - Customer profile operations always use the authenticated user's ID from SecurityContext.
 * - Admin operations verify resource ownership or require SUPER_ADMIN role.
 * - Never trust a user-supplied ID for their own resources.
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ---- Self-service (CUSTOMER) ----

    /**
     * Returns the authenticated user's profile.
     * Uses the authenticated userId from SecurityContext — never a user-supplied ID.
     */
    @Transactional(readOnly = true)
    public UserResponse getMyProfile(UUID authenticatedUserId) {
        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> ResourceNotFoundException.user(authenticatedUserId.toString()));
        return UserResponse.from(user);
    }

    /**
     * Updates the authenticated user's profile (firstName, lastName, mobile only).
     * Email and role changes are done through separate controlled flows.
     */
    @Transactional
    public UserResponse updateMyProfile(UUID authenticatedUserId, UpdateProfileRequest request) {
        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> ResourceNotFoundException.user(authenticatedUserId.toString()));

        if (request.firstName() != null && !request.firstName().isBlank()) {
            user.setFirstName(request.firstName().trim());
        }
        if (request.lastName() != null && !request.lastName().isBlank()) {
            user.setLastName(request.lastName().trim());
        }
        if (request.firstName() != null || request.lastName() != null) {
            user.setName((user.getFirstName() + " " + user.getLastName()).trim());
        }
        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().trim().toLowerCase();
            if (!email.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmail(email)) {
                    throw DuplicateResourceException.email(email);
                }
                user.setEmail(email);
                user.setEmailVerified(false);
            }
        }
        if (request.mobile() != null && !request.mobile().isBlank()) {
            String mobile = request.mobile().trim();
            // Check uniqueness (only if changing)
            if (!mobile.equals(user.getMobile())) {
                if (userRepository.existsByMobile(mobile)) {
                    throw DuplicateResourceException.mobile(mobile);
                }
                user.setMobile(mobile);
                user.setMobileVerified(false); // Re-verify after mobile change
            }
        }

        User updated = userRepository.save(user);
        log.info("Profile updated for user={}", authenticatedUserId);
        return UserResponse.from(updated);
    }

    // ---- Admin operations (SUPER_ADMIN) ----

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(UserResponse::from);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID userId) {
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> ResourceNotFoundException.user(userId.toString()));
    }

    @Transactional
    public UserResponse changeUserStatus(UUID userId, UserStatus newStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.user(userId.toString()));
        user.setStatus(newStatus);
        User updated = userRepository.save(user);
        log.info("Admin changed status of user={} to {}", userId, newStatus);
        return UserResponse.from(updated);
    }

    @Transactional
    public UserResponse changeUserRole(UUID userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.user(userId.toString()));
        Role oldRole = user.getRole();
        user.setRole(newRole);
        User updated = userRepository.save(user);
        log.info("Admin changed role of user={} from {} to {}", userId, oldRole, newRole);
        return UserResponse.from(updated);
    }

    @Transactional
    public void deleteUser(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw ResourceNotFoundException.user(userId.toString());
        }
        userRepository.deleteById(userId);
        log.info("Admin deleted user={}", userId);
    }

    /**
     * Admin user creation endpoint (provisions CUSTOMER, MERCHANT, or ADMIN).
     * Profile picture can only be set at creation time.
     */
    @Transactional
    public UserResponse createUser(com.superapp.user.dto.CreateUserRequest request) {
        String email = request.email().trim().toLowerCase();
        log.info("Admin creating user email={} role={}", email, request.role());

        if (userRepository.existsByEmail(email)) {
            throw DuplicateResourceException.email(email);
        }

        if (request.mobile() != null && !request.mobile().isBlank()) {
            String mobile = request.mobile().trim();
            if (userRepository.existsByMobile(mobile)) {
                throw DuplicateResourceException.mobile(mobile);
            }
        }

        String name = (request.firstName().trim() + " " + request.lastName().trim()).trim();
        User user = new User(email, name, request.firstName().trim(), request.lastName().trim(),
                passwordEncoder.encode(request.password()), request.role());

        if (request.mobile() != null && !request.mobile().isBlank()) {
            user.setMobile(request.mobile().trim());
        }

        if (request.profilePictureUrl() != null && !request.profilePictureUrl().isBlank()) {
            user.setProfilePictureUrl(request.profilePictureUrl().trim());
        }

        User saved = userRepository.save(user);
        userRepository.flush();
        log.info("Admin created user id={} email={} role={}", saved.getId(), email, saved.getRole());
        return UserResponse.from(saved);
    }
}
