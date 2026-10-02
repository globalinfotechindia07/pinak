package com.superapp.user.repository;

import com.superapp.user.entity.StaffMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StaffMemberRepository extends JpaRepository<StaffMember, UUID> {

    List<StaffMember> findByScope(String scope);

    List<StaffMember> findByMerchantId(UUID merchantId);

    List<StaffMember> findByStoreId(UUID storeId);

    List<StaffMember> findByUserId(UUID userId);

    @Query("SELECT s FROM StaffMember s WHERE s.userId = :userId AND s.scope = 'PLATFORM' AND s.status = 'ACTIVE'")
    Optional<StaffMember> findActivePlatformStaff(@Param("userId") UUID userId);

    @Query("SELECT s FROM StaffMember s WHERE s.userId = :userId AND s.storeId = :storeId AND s.status = 'ACTIVE'")
    Optional<StaffMember> findActiveStoreStaff(@Param("userId") UUID userId, @Param("storeId") UUID storeId);

    boolean existsByRoleId(String roleId);

    @Query(value = "SELECT * FROM staff_members WHERE custom_permissions->>'inviteToken' = :token", nativeQuery = true)
    Optional<StaffMember> findByInviteToken(@Param("token") String token);
}
