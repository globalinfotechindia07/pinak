package com.superapp.merchant.repository;

import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchantRepository extends JpaRepository<Merchant, UUID> {

    List<Merchant> findByOwnerUserId(UUID ownerUserId);

    Page<Merchant> findByOwnerUserId(UUID ownerUserId, Pageable pageable);

    Page<Merchant> findByStatus(ApprovalStatus status, Pageable pageable);

    Page<Merchant> findByCategoryId(UUID categoryId, Pageable pageable);

    boolean existsByBusinessNameIgnoreCase(String businessName);
}
