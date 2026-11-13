package com.superapp.coupon.repository;

import com.superapp.coupon.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, UUID> {

    Optional<Coupon> findByCodeIgnoreCaseAndIsActiveTrue(String code);

    Optional<Coupon> findByCodeIgnoreCase(String code);

    @Query("SELECT c FROM Coupon c WHERE c.isActive = true " +
           "AND (c.validFrom IS NULL OR c.validFrom <= :now) " +
           "AND (c.validTo IS NULL OR c.validTo >= :now) " +
           "AND (c.storeId IS NULL OR :storeId IS NULL OR c.storeId = :storeId) " +
           "ORDER BY c.displayOrder ASC, c.createdAt DESC")
    List<Coupon> findApplicableCoupons(@Param("storeId") UUID storeId, @Param("now") Instant now);
}
