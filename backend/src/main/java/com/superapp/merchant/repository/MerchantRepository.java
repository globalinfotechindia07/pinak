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

    long countByApprovalStatus(ApprovalStatus approvalStatus);

    long countByStatus(MerchantStatus status);
}
