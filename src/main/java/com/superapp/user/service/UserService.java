package com.superapp.user.service;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.exception.UserSuspendedException;
import com.superapp.user.dto.CreateUserRequest;
import com.superapp.user.dto.UpdateProfileRequest;
import com.superapp.user.dto.UserResponse;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.mapper.UserMapper;
import com.superapp.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
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
    private final UserMapper userMapper;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       UserMapper userMapper, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper != null ? userMapper : new UserMapper();
        this.auditService = auditService;
    }

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this(userRepository, passwordEncoder, new UserMapper(), null);
    }

    // ---- Self-service (CUSTOMER) ----

    /**
     * Returns the authenticated user's profile.
     * Uses the authenticated userId from SecurityContext — never a user-supplied ID.
     */
    @Transactional(readOnly = true)
    public UserResponse getMyProfile(UUID authenticatedUserId) {
        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(ResourceNotFoundException::user);

        if (user.isSuspended()) {
            throw new UserSuspendedException();
        }

        return userMapper.toResponse(user);
    }

    /**
     * Updates the authenticated user's profile (firstName, lastName, email only).
     * Phone, role, status, and sensitive security fields cannot be modified here.
     */
    @Transactional
    public UserResponse updateMyProfile(UUID authenticatedUserId, UpdateProfileRequest request) {
        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(ResourceNotFoundException::user);

        if (user.isSuspended()) {
            throw new UserSuspendedException();
        }

        boolean emailChanged = false;

        if (request.firstName() != null && !request.firstName().isBlank()) {
            user.setFirstName(request.firstName().trim());
        }
        if (request.lastName() != null && !request.lastName().isBlank()) {
            user.setLastName(request.lastName().trim());
        }
        if (request.firstName() != null || request.lastName() != null) {
            String firstName = user.getFirstName() != null ? user.getFirstName().trim() : "";
            String lastName = user.getLastName() != null ? user.getLastName().trim() : "";
            user.setName((firstName + " " + lastName).trim());
        }

        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().trim().toLowerCase();
            if (!email.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmail(email)) {
                    throw DuplicateResourceException.email(email);
                }
                user.setEmail(email);
                user.setEmailVerified(false);
                emailChanged = true;
            }
        }

        user.setProfileCompleted(calculateProfileCompleted(user));
        User updated = userRepository.save(user);

        String requestId = MDC.get("requestId");
        if (auditService != null) {
            if (emailChanged) {
                auditService.record(AuditEventType.EMAIL_CHANGED, user.getId(), null, null, requestId);
            }
            auditService.record(AuditEventType.PROFILE_UPDATED, user.getId(), null, null, requestId);
        }

        log.info("Profile updated for user={}", authenticatedUserId);
        return userMapper.toResponse(updated);
    }

    /**
     * Calculates whether a user's profile is complete based on required business fields.
     */
    public boolean calculateProfileCompleted(User user) {
        if (user == null) {
            return false;
        }
        boolean hasFirst = user.getFirstName() != null && !user.getFirstName().isBlank();
        boolean hasLast = user.getLastName() != null && !user.getLastName().isBlank();
        boolean hasEmail = user.getEmail() != null && !user.getEmail().isBlank();
        boolean hasPhone = (user.getPhone() != null && !user.getPhone().isBlank())
                || (user.getMobile() != null && !user.getMobile().isBlank());
        return hasFirst && hasLast && hasEmail && hasPhone;
    }

    // ---- Admin operations (SUPER_ADMIN) ----

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getAdminUsers(
            UserStatus status,
            Role role,
            String search,
            java.time.Instant fromDate,
            java.time.Instant toDate,
            Pageable pageable) {

        int pageNumber = Math.max(pageable.getPageNumber(), 0);
        int pageSize = Math.min(Math.max(pageable.getPageSize(), 1), 100);

        java.util.List<org.springframework.data.domain.Sort.Order> allowedOrders = new java.util.ArrayList<>();
        if (pageable.getSort().isSorted()) {
            for (org.springframework.data.domain.Sort.Order order : pageable.getSort()) {
                String property = order.getProperty();
                if ("createdAt".equalsIgnoreCase(property) ||
                    "name".equalsIgnoreCase(property) ||
                    "email".equalsIgnoreCase(property) ||
                    "status".equalsIgnoreCase(property) ||
                    "role".equalsIgnoreCase(property)) {
                    allowedOrders.add(new org.springframework.data.domain.Sort.Order(order.getDirection(), property));
                }
            }
        }
        if (allowedOrders.isEmpty()) {
            allowedOrders.add(new org.springframework.data.domain.Sort.Order(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        }
        Pageable effectivePageable = org.springframework.data.domain.PageRequest.of(pageNumber, pageSize, org.springframework.data.domain.Sort.by(allowedOrders));

        org.springframework.data.jpa.domain.Specification<User> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                jakarta.persistence.criteria.Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                jakarta.persistence.criteria.Predicate emailMatch = cb.like(cb.lower(root.get("email")), pattern);
                jakarta.persistence.criteria.Predicate mobileMatch = cb.like(cb.lower(root.get("mobile")), pattern);
                predicates.add(cb.or(nameMatch, emailMatch, mobileMatch));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return userRepository.findAll(spec, effectivePageable).map(userMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID userId) {
        return userRepository.findById(userId)
                .map(userMapper::toResponse)
                .orElseThrow(ResourceNotFoundException::user);
    }

    @Transactional
    public UserResponse changeUserStatus(UUID userId, UserStatus newStatus) {
        return changeUserStatus(userId, newStatus, null, null, MDC.get("requestId"));
    }

    @Transactional
    public UserResponse changeUserStatus(UUID userId, UserStatus newStatus, String reason, UUID adminUserId, String requestId) {
        User user = userRepository.findById(userId)
                .orElseThrow(ResourceNotFoundException::user);
        user.setStatus(newStatus);
        User updated = userRepository.save(user);

        if (auditService != null) {
            String metadata = reason != null ? "{\"reason\":\"" + reason + "\"}" : null;
            if (newStatus == UserStatus.SUSPENDED) {
                auditService.record(AuditEventType.ACCOUNT_SUSPENDED, userId, null, null, requestId, metadata);
            } else if (newStatus == UserStatus.ACTIVE) {
                auditService.record(AuditEventType.ACCOUNT_ACTIVATED, userId, null, null, requestId, metadata);
            } else if (newStatus == UserStatus.INACTIVE) {
                auditService.record(AuditEventType.ACCOUNT_DEACTIVATED, userId, null, null, requestId, metadata);
            } else if (newStatus == UserStatus.BLOCKED) {
                auditService.record(AuditEventType.ACCOUNT_BLOCKED, userId, null, null, requestId, metadata);
            }
        }

        log.info("Admin {} changed status of user={} to {} (reason={})", adminUserId, userId, newStatus, reason);
        return userMapper.toResponse(updated);
    }

    @Transactional
    public UserResponse changeUserRole(UUID userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(ResourceNotFoundException::user);
        Role oldRole = user.getRole();
        user.setRole(newRole);
        User updated = userRepository.save(user);

        if (auditService != null) {
            auditService.record(AuditEventType.ROLE_CHANGED, userId, null, null, MDC.get("requestId"),
                    "{\"oldRole\":\"" + oldRole + "\",\"newRole\":\"" + newRole + "\"}");
        }

        log.info("Admin changed role of user={} from {} to {}", userId, oldRole, newRole);
        return userMapper.toResponse(updated);
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
     */
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        String email = request.email().trim().toLowerCase();
        log.info("Admin creating user email={} role={}", email, request.role());

        if (userRepository.existsByEmail(email)) {
            throw DuplicateResourceException.email(email);
        }

        if (request.mobile() != null && !request.mobile().isBlank()) {
            String mobile = request.mobile().trim();
            if (userRepository.existsByMobile(mobile) || userRepository.existsByPhone(mobile)) {
                throw DuplicateResourceException.mobile(mobile);
            }
        }

        String name = (request.firstName().trim() + " " + request.lastName().trim()).trim();
        User user = new User(email, name, request.firstName().trim(), request.lastName().trim(),
                passwordEncoder.encode(request.password()), request.role());

        if (request.mobile() != null && !request.mobile().isBlank()) {
            user.setMobile(request.mobile().trim());
            user.setPhone(request.mobile().trim());
        }

        if (request.profilePictureUrl() != null && !request.profilePictureUrl().isBlank()) {
            user.setProfilePictureUrl(request.profilePictureUrl().trim());
        }

        user.setProfileCompleted(calculateProfileCompleted(user));

        User saved = userRepository.save(user);
        userRepository.flush();
        log.info("Admin created user id={} email={} role={}", saved.getId(), email, saved.getRole());
        return userMapper.toResponse(saved);
    }
}
