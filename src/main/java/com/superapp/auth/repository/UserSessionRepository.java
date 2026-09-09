package com.superapp.auth.repository;

import com.superapp.user.entity.User;
import com.superapp.user.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    /** Returns all non-revoked, non-expired sessions for a user. */
    @Query("SELECT s FROM UserSession s WHERE s.user = :user AND s.revokedAt IS NULL AND s.expiresAt > :now")
    List<UserSession> findActiveSessions(@Param("user") User user, @Param("now") Instant now);

    @Query("SELECT s FROM UserSession s WHERE s.user.id = :userId AND s.revokedAt IS NULL AND s.expiresAt > :now")
    List<UserSession> findActiveSessionsByUserId(@Param("userId") UUID userId, @Param("now") Instant now);

    Optional<UserSession> findByIdAndUser(UUID id, User user);

    /** Revoke all active sessions for a user (logout-all). */
    @Modifying
    @Query("UPDATE UserSession s SET s.revokedAt = :now WHERE s.user = :user AND s.revokedAt IS NULL")
    int revokeAllForUser(@Param("user") User user, @Param("now") Instant now);
}
