package com.example.auth.repository;

import com.example.auth.entity.Role;
import com.example.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for User entity operations.
 * Spring Data automatically creates the implementation proxy at runtime.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Finds a user by their unique email address.
     * Used heavily during login and UserDetailsService lookups.
     *
     * @param email user's email address
     * @return Optional containing the User if found, or empty Optional if not found
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks if a user already exists with the given email address.
     * Used during registration to prevent duplicate accounts.
     *
     * @param email user's email address
     * @return true if email exists in database, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Counts the total number of users with a specific role.
     *
     * @param role user role
     * @return count of matching users
     */
    long countByRole(Role role);

    /**
     * Retrieves the 5 most recently registered users for the admin dashboard.
     *
     * @return list of recent users
     */
    List<User> findTop5ByOrderByCreatedAtDesc();
}
