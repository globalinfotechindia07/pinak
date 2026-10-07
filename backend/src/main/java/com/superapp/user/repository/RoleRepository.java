package com.superapp.user.repository;

import com.superapp.user.entity.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<RoleEntity, String> {

    List<RoleEntity> findByScope(String scope);

    @Query("SELECT r FROM RoleEntity r WHERE r.scope = :scope AND (r.scopeId IS NULL OR r.scopeId = :scopeId)")
    List<RoleEntity> findAvailableRolesForScope(@Param("scope") String scope, @Param("scopeId") UUID scopeId);

    List<RoleEntity> findByScopeAndScopeId(String scope, UUID scopeId);
}
