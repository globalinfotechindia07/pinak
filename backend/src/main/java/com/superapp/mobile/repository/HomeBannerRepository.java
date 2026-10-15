package com.superapp.mobile.repository;

import com.superapp.mobile.entity.HomeBanner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HomeBannerRepository extends JpaRepository<HomeBanner, UUID> {

    @Query("SELECT b FROM HomeBanner b WHERE b.isActive = true ORDER BY b.displayOrder ASC, b.createdAt DESC")
    List<HomeBanner> findAllActiveBanners();
}
