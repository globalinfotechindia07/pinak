package com.superapp.auth.repository;

import com.superapp.user.entity.PasswordResetToken;
import com.superapp.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    /** Returns all valid (not expired, not used) reset tokens for a user. */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user = :user AND t.usedAt IS NULL AND t.expiresAt > :now")
    List<PasswordResetToken> findValidTokensForUser(@Param("user") User user, @Param("now") Instant now);

    /** Invalidates any existing active reset tokens before issuing a new one. */
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.usedAt = :now WHERE t.user = :user AND t.usedAt IS NULL")
    int invalidateAllForUser(@Param("user") User user, @Param("now") Instant now);
}
