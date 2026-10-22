package com.superapp.merchant.repository;

import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.enums.MerchantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchantRepository extends JpaRepository<Merchant, UUID> {

    Optional<Merchant> findByOwnerUserId(UUID ownerUserId);

    List<Merchant> findAllByOwnerUserId(UUID ownerUserId);

    Page<Merchant> findByOwnerUserId(UUID ownerUserId, Pageable pageable);

    boolean existsByOwnerUserId(UUID ownerUserId);

    Page<Merchant> findByStatus(MerchantStatus status, Pageable pageable);

    Page<Merchant> findByApprovalStatus(ApprovalStatus approvalStatus, Pageable pageable);

    Page<Merchant> findByStatusAndApprovalStatus(MerchantStatus status, ApprovalStatus approvalStatus, Pageable pageable);

    Page<Merchant> findByCategoryId(UUID categoryId, Pageable pageable);

    boolean existsByBusinessNameIgnoreCase(String businessName);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

    @org.springframework.data.jpa.repository.Query("SELECT m FROM Merchant m WHERE m.phone IS NOT NULL AND (m.phone = :phone OR m.phone LIKE CONCAT('%', :last10))")
    java.util.List<Merchant> findByPhoneOrSuffix(@org.springframework.data.repository.query.Param("phone") String phone, @org.springframework.data.repository.query.Param("last10") String last10);

    long countByApprovalStatus(ApprovalStatus approvalStatus);

    long countByStatus(MerchantStatus status);

    @org.springframework.data.jpa.repository.Query("""
            SELECT m FROM Merchant m
            WHERE m.status = com.superapp.merchant.enums.MerchantStatus.ACTIVE
            AND (m.approvalStatus = com.superapp.merchant.entity.ApprovalStatus.APPROVED OR m.approvalStatus IS NULL)
            AND (m.isFeatured = TRUE OR m.kycStatus = com.superapp.merchant.entity.KycStatus.VERIFIED OR m.isFeatured IS NULL)
            ORDER BY m.createdAt DESC
            """)
    Page<Merchant> findFeaturedMerchants(Pageable pageable);

    @org.springframework.data.jpa.repository.Query("""
            SELECT m FROM Merchant m
            WHERE m.status = com.superapp.merchant.enums.MerchantStatus.ACTIVE
            AND m.approvalStatus = com.superapp.merchant.entity.ApprovalStatus.APPROVED
            ORDER BY m.createdAt DESC
            """)
    Page<Merchant> findNewlyAddedMerchants(Pageable pageable);
}
