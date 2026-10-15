package com.superapp.benefit.repository;

import com.superapp.benefit.entity.DiscoverBenefit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DiscoverBenefitRepository extends JpaRepository<DiscoverBenefit, UUID> {

    @Query("""
            SELECT b FROM DiscoverBenefit b
            WHERE b.isActive = TRUE
            ORDER BY b.displayOrder ASC, b.createdAt ASC
            """)
    List<DiscoverBenefit> findActiveBenefits();
}
