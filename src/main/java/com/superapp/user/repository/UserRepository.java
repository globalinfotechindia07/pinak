package com.superapp.user.repository;

import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    Optional<User> findByMobile(String mobile);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByMobile(String mobile);

    Optional<User> findByIdAndStatus(UUID id, UserStatus status);

    Optional<User> findByEmailAndStatus(String email, UserStatus status);

    Optional<User> findByPhoneAndStatus(String phone, UserStatus status);

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.status = 'ACTIVE'")
    Optional<User> findActiveUserById(@Param("id") UUID id);

    long countByStatus(UserStatus status);
}
