package com.superapp.user.service;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.exception.UserSuspendedException;
import com.superapp.user.dto.RoleDTO;
import com.superapp.user.dto.StaffDTO;
import com.superapp.user.dto.UserDTO;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.RoleEntity;
import com.superapp.user.entity.StaffMember;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.mapper.UserMapper;
import com.superapp.user.repository.RoleRepository;
import com.superapp.user.repository.StaffMemberRepository;
import com.superapp.user.repository.UserRepository;
import com.superapp.common.email.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
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
    private final RoleRepository roleRepository;
    private final StaffMemberRepository staffMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final AuditService auditService;
    private final EmailService emailService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @Autowired
    public UserService(UserRepository userRepository, RoleRepository roleRepository,
                       StaffMemberRepository staffMemberRepository, PasswordEncoder passwordEncoder,
                       UserMapper userMapper, AuditService auditService,
                       @Autowired(required = false) EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.staffMemberRepository = staffMemberRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper != null ? userMapper : new UserMapper();
        this.auditService = auditService;
        this.emailService = emailService;
    }

    public UserService(UserRepository userRepository, RoleRepository roleRepository,
                       StaffMemberRepository staffMemberRepository, PasswordEncoder passwordEncoder,
                       UserMapper userMapper, AuditService auditService) {
        this(userRepository, roleRepository, staffMemberRepository, passwordEncoder, userMapper, auditService, null);
    }

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       UserMapper userMapper, AuditService auditService) {
        this(userRepository, null, null, passwordEncoder, userMapper, auditService, null);
    }

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this(userRepository, null, null, passwordEncoder, new UserMapper(), null, null);
    }

    // ---- Self-service (CUSTOMER) ----

    /**
     * Returns the authenticated user's profile.
     * Uses the authenticated userId from SecurityContext — never a user-supplied ID.
     */
    @Transactional(readOnly = true)
    public UserDTO.Response getMyProfile(UUID authenticatedUserId) {
        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(ResourceNotFoundException::user);

        if (user.isSuspended()) {
            throw new UserSuspendedException();
        }

        return userMapper.toResponse(user);
    }

    /**
     * Updates the authenticated user's profile.
     * ALL fields are optional — only non-null/non-blank values are applied.
     * Updatable: firstName, lastName, email, mobile, profilePictureUrl.
     */
    @Transactional
    public UserDTO.Response updateMyProfile(UUID authenticatedUserId, UserDTO.UpdateProfileRequest request) {
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

        if (request.mobile() != null && !request.mobile().isBlank()) {
            String mobile = request.mobile().trim();
            if (!mobile.equals(user.getMobile()) && !mobile.equals(user.getPhone())) {
                if (userRepository.existsByMobile(mobile) || userRepository.existsByPhone(mobile)) {
                    throw DuplicateResourceException.mobile(mobile);
                }
            }
            user.setMobile(mobile);
        }

        if (request.profilePictureUrl() != null && !request.profilePictureUrl().isBlank()) {
            user.setProfilePictureUrl(request.profilePictureUrl().trim());
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
    public Page<UserDTO.Response> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<UserDTO.Response> getAdminUsers(
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
    public UserDTO.Response getUserById(UUID userId) {
        return userRepository.findById(userId)
                .map(userMapper::toResponse)
                .orElseThrow(ResourceNotFoundException::user);
    }

    @Transactional
    public UserDTO.Response changeUserStatus(UUID userId, UserStatus newStatus) {
        return changeUserStatus(userId, newStatus, null, null, MDC.get("requestId"));
    }

    @Transactional
    public UserDTO.Response changeUserStatus(UUID userId, UserStatus newStatus, String reason, UUID adminUserId, String requestId) {
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
    public UserDTO.Response changeUserRole(UUID userId, Role newRole) {
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
    public UserDTO.Response createUser(UserDTO.CreateRequest request) {
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

    // ---- Scoped Roles & RBAC Management ----

    @Transactional(readOnly = true)
    public List<RoleDTO.Response> getRoles(String scope, UUID scopeId) {
        if (roleRepository == null) return List.of();
        List<RoleEntity> roles = scopeId != null
                ? roleRepository.findAvailableRolesForScope(scope, scopeId)
                : roleRepository.findByScope(scope);
        return roles.stream().map(this::toRoleResponse).toList();
    }

    @Transactional
    public RoleDTO.Response createRole(RoleDTO.CreateRequest request, UUID adminUserId) {
        if (roleRepository == null) throw new IllegalStateException("Role repository not available");
        String roleId = request.id() != null && !request.id().isBlank()
                ? request.id().trim().toUpperCase()
                : "ROLE_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        RoleEntity role = new RoleEntity(
                roleId,
                request.scope() != null ? request.scope().trim().toUpperCase() : "PLATFORM",
                request.scopeId(),
                request.name(),
                request.description(),
                request.badgeCls() != null ? request.badgeCls() : "bg-gray-100 text-gray-700",
                false,
                request.permissions() != null ? request.permissions() : "{}",
                adminUserId
        );
        RoleEntity saved = roleRepository.save(role);
        return toRoleResponse(saved);
    }

    // ---- Scoped Staff Team Management ----

    @Transactional(readOnly = true)
    public List<StaffDTO.Response> getStaffMembers(String scope, UUID scopeId) {
        if (staffMemberRepository == null) return List.of();
        List<StaffMember> staffList = scopeId != null
                ? ("MERCHANT".equalsIgnoreCase(scope) ? staffMemberRepository.findByMerchantId(scopeId) : staffMemberRepository.findByStoreId(scopeId))
                : staffMemberRepository.findByScope(scope);

        return staffList.stream().map(staff -> {
            User user = userRepository.findById(staff.getUserId()).orElse(null);
            RoleEntity role = staff.getRoleId() != null && roleRepository != null ? roleRepository.findById(staff.getRoleId()).orElse(null) : null;
            return toStaffResponse(staff, user, role);
        }).toList();
    }

    @Transactional
    public StaffDTO.Response assignOrInviteStaff(StaffDTO.InviteRequest request, UUID invitedBy) {
        if (staffMemberRepository == null) throw new IllegalStateException("Staff repository not available");
        String email = request.email().trim().toLowerCase();

        Role intendedRole = "PLATFORM".equalsIgnoreCase(request.scope()) ? Role.ADMIN : Role.CUSTOMER;

        User user = userRepository.findByEmail(email).map(existing -> {
            if ("PLATFORM".equalsIgnoreCase(request.scope()) && existing.getRole() != Role.ADMIN && existing.getRole() != Role.SUPER_ADMIN) {
                existing.setRole(Role.ADMIN);
                return userRepository.save(existing);
            }
            return existing;
        }).orElseGet(() -> {
            String name = request.name() != null && !request.name().isBlank() ? request.name().trim() : "Staff " + email.split("@")[0];
            String[] parts = name.split(" ", 2);
            String first = parts[0];
            String last = parts.length > 1 ? parts[1] : "";
            User newUser = new User(email, name, first, last,
                    passwordEncoder.encode(UUID.randomUUID().toString()), intendedRole);
            if (request.phone() != null && !request.phone().isBlank()) {
                newUser.setMobile(request.phone().trim());
                newUser.setPhone(request.phone().trim());
            }
            newUser.setEmailVerified(false);
            newUser.setStatus(UserStatus.ACTIVE);
            return userRepository.save(newUser);
        });

        String hashedPin = request.posPin() != null && !request.posPin().isBlank()
                ? passwordEncoder.encode(request.posPin().trim())
                : null;

        // Production-Grade Cryptographically Secure 1-Time Invitation Token (48h expiry)
        String inviteToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        Instant inviteExpiresAt = Instant.now().plus(48, java.time.temporal.ChronoUnit.HOURS);
        String inviteUrl = "http://localhost:3000/accept-invite?token=" + inviteToken;

        String permissionsJson = request.customPermissions() != null && !request.customPermissions().isBlank()
                ? request.customPermissions() : "{}";
        try {
            com.fasterxml.jackson.databind.JsonNode parsed = objectMapper.readTree(permissionsJson);
            com.fasterxml.jackson.databind.node.ObjectNode node = parsed.isObject()
                    ? (com.fasterxml.jackson.databind.node.ObjectNode) parsed
                    : objectMapper.createObjectNode();
            node.put("inviteToken", inviteToken);
            node.put("inviteExpiresAt", inviteExpiresAt.toString());
            permissionsJson = node.toString();
        } catch (Exception e) {
            log.warn("Could not parse permissions JSON, generating fresh token envelope: {}", e.getMessage());
            permissionsJson = "{\"inviteToken\":\"" + inviteToken + "\",\"inviteExpiresAt\":\"" + inviteExpiresAt + "\"}";
        }

        StaffMember staff = new StaffMember(
                user.getId(),
                request.roleId(),
                request.scope() != null ? request.scope().trim().toUpperCase() : "PLATFORM",
                request.merchantId(),
                request.storeId(),
                hashedPin,
                "INVITED",
                permissionsJson,
                invitedBy
        );

        StaffMember saved = staffMemberRepository.save(staff);
        RoleEntity role = request.roleId() != null && roleRepository != null ? roleRepository.findById(request.roleId()).orElse(null) : null;

        log.info("📧 [STAFF INVITATION DISPATCHED] Recipient: {} | Role: {} | Scope: {} | Direct Link: {}",
                email, request.roleId(), request.scope(), inviteUrl);

        if (emailService != null) {
            String recipientName = request.name() != null && !request.name().isBlank() ? request.name() : email;
            String roleDisplayName = role != null && role.getName() != null ? role.getName() : request.roleId();
            emailService.sendStaffInvitationEmail(email, recipientName, roleDisplayName, inviteUrl);
        }

        return toStaffResponse(saved, user, role);
    }

    @Transactional
    public StaffDTO.Response updateStaffStatus(UUID staffId, String status) {
        if (staffMemberRepository == null) throw new IllegalStateException("Staff repository not available");
        StaffMember staff = staffMemberRepository.findById(staffId)
                .orElseThrow(() -> ResourceNotFoundException.user("Staff assignment not found"));
        staff.setStatus(status.trim().toUpperCase());
        StaffMember saved = staffMemberRepository.save(staff);
        User user = userRepository.findById(saved.getUserId()).orElse(null);
        RoleEntity role = saved.getRoleId() != null && roleRepository != null ? roleRepository.findById(saved.getRoleId()).orElse(null) : null;
        return toStaffResponse(saved, user, role);
    }

    @Transactional
    public void removeStaffMember(UUID staffId) {
        if (staffMemberRepository == null) throw new IllegalStateException("Staff repository not available");
        if (!staffMemberRepository.existsById(staffId)) {
            throw ResourceNotFoundException.user("Staff assignment not found");
        }
        staffMemberRepository.deleteById(staffId);
    }

    @Transactional
    public StaffDTO.Response updateStaffRole(UUID staffId, String roleId, String customPermissions) {
        if (staffMemberRepository == null) throw new IllegalStateException("Staff repository not available");
        StaffMember staff = staffMemberRepository.findById(staffId)
                .orElseThrow(() -> ResourceNotFoundException.user("Staff assignment not found"));
        if (roleId != null && !roleId.isBlank()) {
            staff.setRoleId(roleId.trim());
        }
        if (customPermissions != null) {
            staff.setCustomPermissions(customPermissions);
        }
        StaffMember saved = staffMemberRepository.save(staff);
        User user = userRepository.findById(saved.getUserId()).orElse(null);
        RoleEntity role = saved.getRoleId() != null && roleRepository != null ? roleRepository.findById(saved.getRoleId()).orElse(null) : null;
        return toStaffResponse(saved, user, role);
    }

    @Transactional
    public void deleteRole(String roleId) {
        if (roleRepository == null) throw new IllegalStateException("Role repository not available");
        RoleEntity role = roleRepository.findById(roleId)
                .orElseThrow(() -> ResourceNotFoundException.user("Role not found"));
        if (role.isSystem()) {
            throw new IllegalArgumentException("System roles cannot be deleted");
        }
        if (staffMemberRepository.existsByRoleId(roleId)) {
            throw new IllegalArgumentException("Cannot delete role: active staff members are assigned to this role");
        }
        roleRepository.delete(role);
    }

    private RoleDTO.Response toRoleResponse(RoleEntity role) {
        return new RoleDTO.Response(
                role.getId(),
                role.getScope(),
                role.getScopeId(),
                role.getName(),
                role.getDescription(),
                role.getBadgeCls(),
                role.isSystem(),
                role.getPermissions(),
                role.getCreatedBy(),
                role.getCreatedAt(),
                role.getUpdatedAt()
        );
    }

    public StaffDTO.VerifyInviteResponse verifyInviteToken(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Invitation token is required");
        }
        StaffMember staff = staffMemberRepository.findByInviteToken(token.trim())
                .orElseThrow(() -> ResourceNotFoundException.user("Invalid or expired invitation link"));

        if (!"INVITED".equalsIgnoreCase(staff.getStatus())) {
            throw new IllegalStateException("This invitation has already been accepted or is no longer pending");
        }

        try {
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(staff.getCustomPermissions());
            String expiryStr = root.path("inviteExpiresAt").asText(null);
            if (expiryStr != null && !expiryStr.isBlank()) {
                java.time.Instant expiry = java.time.Instant.parse(expiryStr);
                if (java.time.Instant.now().isAfter(expiry)) {
                    throw new IllegalStateException("This invitation link has expired. Please request a new invite from your administrator.");
                }
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Error parsing invite expiry: {}", e.getMessage());
        }

        User user = userRepository.findById(staff.getUserId())
                .orElseThrow(() -> ResourceNotFoundException.user("Invited user not found"));
        RoleEntity role = staff.getRoleId() != null && roleRepository != null
                ? roleRepository.findById(staff.getRoleId()).orElse(null) : null;

        return new StaffDTO.VerifyInviteResponse(
                user.getName(),
                user.getEmail(),
                staff.getRoleId(),
                role != null ? role.getDisplayName() : staff.getRoleId(),
                staff.getScope()
        );
    }

    @Transactional
    public StaffDTO.Response acceptInvite(String token, String password) {
        if (token == null || token.isBlank() || password == null || password.length() < 8) {
            throw new IllegalArgumentException("Valid invitation token and a minimum 8-character password are required");
        }
        StaffMember staff = staffMemberRepository.findByInviteToken(token.trim())
                .orElseThrow(() -> ResourceNotFoundException.user("Invalid or expired invitation link"));

        if (!"INVITED".equalsIgnoreCase(staff.getStatus())) {
            throw new IllegalStateException("This invitation has already been accepted");
        }

        User user = userRepository.findById(staff.getUserId())
                .orElseThrow(() -> ResourceNotFoundException.user("Invited user not found"));

        // 1. Establish credential and verify email
        user.setPassword(passwordEncoder.encode(password));
        user.setEmailVerified(true);
        user.setStatus(UserStatus.ACTIVE);
        if ("PLATFORM".equalsIgnoreCase(staff.getScope()) && user.getRole() != Role.SUPER_ADMIN) {
            user.setRole(Role.ADMIN);
        } else if (("MERCHANT".equalsIgnoreCase(staff.getScope()) || "STORE".equalsIgnoreCase(staff.getScope()))
                && user.getRole() == Role.CUSTOMER) {
            user.setRole(Role.MERCHANT);
        }
        userRepository.save(user);

        // 2. Consume token and transition to ACTIVE status
        staff.setStatus("ACTIVE");
        staff.setLastLoginAt(java.time.Instant.now());
        try {
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(staff.getCustomPermissions());
            if (root.isObject()) {
                com.fasterxml.jackson.databind.node.ObjectNode node = (com.fasterxml.jackson.databind.node.ObjectNode) root;
                node.remove("inviteToken");
                node.put("inviteAcceptedAt", java.time.Instant.now().toString());
                staff.setCustomPermissions(node.toString());
            }
        } catch (Exception ignored) {}

        StaffMember saved = staffMemberRepository.save(staff);
        RoleEntity role = staff.getRoleId() != null && roleRepository != null
                ? roleRepository.findById(staff.getRoleId()).orElse(null) : null;

        log.info("🎉 Staff member successfully activated via invitation: user={} email={}", user.getId(), user.getEmail());
        return toStaffResponse(saved, user, role);
    }

    private StaffDTO.Response toStaffResponse(StaffMember staff, User user, RoleEntity role) {
        String inviteUrl = null;
        if ("INVITED".equalsIgnoreCase(staff.getStatus()) && staff.getCustomPermissions() != null) {
            try {
                com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(staff.getCustomPermissions());
                String token = root.path("inviteToken").asText(null);
                if (token != null && !token.isBlank()) {
                    inviteUrl = "http://localhost:3000/accept-invite?token=" + token;
                }
            } catch (Exception ignored) {}
        }

        return new StaffDTO.Response(
                staff.getId(),
                staff.getUserId(),
                user != null ? user.getName() : null,
                user != null ? user.getEmail() : null,
                user != null ? user.getMobile() : null,
                staff.getRoleId(),
                role != null ? role.getDisplayName() : null,
                staff.getScope(),
                staff.getMerchantId(),
                null,
                staff.getStoreId(),
                null,
                staff.getStatus(),
                staff.getCustomPermissions(),
                staff.getLastLoginAt(),
                staff.getCreatedAt(),
                inviteUrl
        );
    }
}
