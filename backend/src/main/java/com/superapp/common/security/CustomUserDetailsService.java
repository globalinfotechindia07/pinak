package com.superapp.common.security;

import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Loads user details by UUID (JWT subject) for Spring Security.
 * The UserDetails username is the user UUID string.
 * Account status (BLOCKED, INACTIVE) is reflected in UserDetails flags.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Loads UserDetails by user UUID (the JWT subject).
     *
     * @param userId the user UUID as a string
     * @throws UsernameNotFoundException if user is not found
     */
    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        java.util.Set<org.springframework.security.core.GrantedAuthority> authorities = new java.util.HashSet<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        if (user.getRole() == com.superapp.user.entity.Role.ADMIN || user.getRole() == com.superapp.user.entity.Role.SUPER_ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            authorities.add(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
        } else if (user.getRole() == com.superapp.user.entity.Role.MERCHANT || user.getRole() == com.superapp.user.entity.Role.VENDOR) {
            authorities.add(new SimpleGrantedAuthority("ROLE_MERCHANT"));
            authorities.add(new SimpleGrantedAuthority("ROLE_VENDOR"));
        } else if (user.getRole() == com.superapp.user.entity.Role.CUSTOMER) {
            authorities.add(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getId().toString())
                .password(user.getPassword())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(UserStatus.BLOCKED.equals(user.getStatus()))
                .credentialsExpired(false)
                .disabled(UserStatus.INACTIVE.equals(user.getStatus()))
                .build();
    }

    /**
     * Loads the full User entity by UUID.
     * Used internally by auth services that need the full entity.
     */
    public User loadUserEntityById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
    }
}
