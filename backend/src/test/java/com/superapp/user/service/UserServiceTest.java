package com.superapp.user.service;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.exception.UserSuspendedException;
import com.superapp.user.dto.UserDTO;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.mapper.UserMapper;
import com.superapp.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditService auditService;

    private final UserMapper userMapper = new UserMapper();
    private UserService userService;

    private User sampleUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder, userMapper, auditService);

        userId = UUID.randomUUID();
        sampleUser = new User("rohan@example.com", "Rohan User", "Rohan", "User", "hashed_pw", Role.CUSTOMER);
        sampleUser.setId(userId);
        sampleUser.setPhone("+919876543210");
        sampleUser.setStatus(UserStatus.ACTIVE);
        sampleUser.setEmailVerified(true);
        sampleUser.setProfileCompleted(true);
    }

    @Nested
    @DisplayName("Get My Profile Tests")
    class GetMyProfileTests {

        @Test
        @DisplayName("Successfully returns authenticated user profile")
        void getMyProfile_success() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));

            UserDTO.Response response = userService.getMyProfile(userId);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(userId.toString());
            assertThat(response.email()).isEqualTo("rohan@example.com");
            assertThat(response.phone()).isEqualTo("+919876543210");
            assertThat(response.firstName()).isEqualTo("Rohan");
            assertThat(response.lastName()).isEqualTo("User");
            assertThat(response.role()).isEqualTo("CUSTOMER");
            assertThat(response.status()).isEqualTo("ACTIVE");
            assertThat(response.profileCompleted()).isTrue();
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when user does not exist")
        void getMyProfile_notFound_throwsException() {
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getMyProfile(userId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("User not found");
        }

        @Test
        @DisplayName("Throws UserSuspendedException when user is SUSPENDED")
        void getMyProfile_suspendedUser_throwsException() {
            sampleUser.setStatus(UserStatus.SUSPENDED);
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> userService.getMyProfile(userId))
                    .isInstanceOf(UserSuspendedException.class)
                    .hasMessage("User account is suspended");
        }

        @Test
        @DisplayName("Throws UserSuspendedException when user is BLOCKED")
        void getMyProfile_blockedUser_throwsException() {
            sampleUser.setStatus(UserStatus.BLOCKED);
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> userService.getMyProfile(userId))
                    .isInstanceOf(UserSuspendedException.class);
        }
    }

    @Nested
    @DisplayName("Update My Profile Tests")
    class UpdateMyProfileTests {

        @Test
        @DisplayName("Successfully updates firstName, lastName, and recalculates profile completion")
        void updateMyProfile_names_success() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UserDTO.UpdateProfileRequest request = new UserDTO.UpdateProfileRequest("Rohan", "Itankar", null);
            UserDTO.Response response = userService.updateMyProfile(userId, request);

            assertThat(response.firstName()).isEqualTo("Rohan");
            assertThat(response.lastName()).isEqualTo("Itankar");
            assertThat(response.name()).isEqualTo("Rohan Itankar");
            assertThat(response.profileCompleted()).isTrue();

            verify(auditService).record(eq(AuditEventType.PROFILE_UPDATED), eq(userId), any(), any(), any());
        }

        @Test
        @DisplayName("Successfully updates email, normalizes case, resets emailVerified flag, and audits EMAIL_CHANGED")
        void updateMyProfile_email_success() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.existsByEmail("new.rohan@example.com")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UserDTO.UpdateProfileRequest request = new UserDTO.UpdateProfileRequest("Rohan", "Itankar", "  NEW.ROHAN@EXAMPLE.COM  ");
            UserDTO.Response response = userService.updateMyProfile(userId, request);

            assertThat(response.email()).isEqualTo("new.rohan@example.com");
            assertThat(sampleUser.isEmailVerified()).isFalse();

            verify(auditService).record(eq(AuditEventType.EMAIL_CHANGED), eq(userId), any(), any(), any());
            verify(auditService).record(eq(AuditEventType.PROFILE_UPDATED), eq(userId), any(), any(), any());
        }

        @Test
        @DisplayName("Throws DuplicateResourceException when new email is already registered")
        void updateMyProfile_duplicateEmail_throwsException() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

            UserDTO.UpdateProfileRequest request = new UserDTO.UpdateProfileRequest("Rohan", "Itankar", "taken@example.com");

            assertThatThrownBy(() -> userService.updateMyProfile(userId, request))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessage("Email is already in use");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Throws UserSuspendedException when suspended user tries to update profile")
        void updateMyProfile_suspendedUser_throwsException() {
            sampleUser.setStatus(UserStatus.SUSPENDED);
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));

            UserDTO.UpdateProfileRequest request = new UserDTO.UpdateProfileRequest("Rohan", "Itankar", "rohan@example.com");

            assertThatThrownBy(() -> userService.updateMyProfile(userId, request))
                    .isInstanceOf(UserSuspendedException.class);

            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Profile Completion Calculation Tests")
    class ProfileCompletionTests {

        @Test
        @DisplayName("Returns true when firstName, lastName, email, and phone are all present")
        void calculateProfileCompleted_fullProfile_returnsTrue() {
            User user = new User("test@example.com", "Test User", "Test", "User", "pw", Role.CUSTOMER);
            user.setPhone("+919876543210");

            assertThat(userService.calculateProfileCompleted(user)).isTrue();
        }

        @Test
        @DisplayName("Returns false when firstName is missing or blank")
        void calculateProfileCompleted_missingFirstName_returnsFalse() {
            User user = new User("test@example.com", "User", "   ", "User", "pw", Role.CUSTOMER);
            user.setPhone("+919876543210");

            assertThat(userService.calculateProfileCompleted(user)).isFalse();
        }

        @Test
        @DisplayName("Returns false when phone/mobile is missing or blank")
        void calculateProfileCompleted_missingPhone_returnsFalse() {
            User user = new User("test@example.com", "Test User", "Test", "User", "pw", Role.CUSTOMER);
            user.setPhone(null);
            user.setMobile(null);

            assertThat(userService.calculateProfileCompleted(user)).isFalse();
        }
    }

    @Nested
    @DisplayName("Admin User Creation Tests")
    class AdminUserCreationTests {

        @Test
        @DisplayName("Creates user with hashed password and calculated profile completion")
        void createUser_success() {
            when(userRepository.existsByEmail("admin.new@example.com")).thenReturn(false);
            when(userRepository.existsByMobile("+919998887776")).thenReturn(false);
            when(passwordEncoder.encode("SecretPass123!")).thenReturn("hashed_secret");

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            when(userRepository.save(captor.capture())).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(UUID.randomUUID());
                return u;
            });

            UserDTO.CreateRequest request = new UserDTO.CreateRequest(
                    "Admin", "User", "admin.new@example.com", "+919998887776",
                    "SecretPass123!", Role.ADMIN, "https://example.com/pic.jpg"
            );

            UserDTO.Response response = userService.createUser(request);

            assertThat(response).isNotNull();
            assertThat(response.role()).isEqualTo("ADMIN");
            assertThat(response.profileCompleted()).isTrue();

            User saved = captor.getValue();
            assertThat(saved.getPassword()).isEqualTo("hashed_secret");
            assertThat(saved.getEmail()).isEqualTo("admin.new@example.com");
            assertThat(saved.getPhone()).isEqualTo("+919998887776");
            assertThat(saved.isProfileCompleted()).isTrue();
        }
    }
}
