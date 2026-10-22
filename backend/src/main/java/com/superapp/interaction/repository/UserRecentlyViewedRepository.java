package com.superapp.interaction.repository;

import com.superapp.interaction.entity.UserRecentlyViewed;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRecentlyViewedRepository extends JpaRepository<UserRecentlyViewed, UUID> {

    @Query("""
            SELECT v FROM UserRecentlyViewed v
            WHERE v.userId = :userId
            ORDER BY v.viewedAt DESC
            """)
    List<UserRecentlyViewed> findRecentByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("""
            SELECT v FROM UserRecentlyViewed v
            WHERE v.userId = :userId AND v.itemType = :itemType
            ORDER BY v.viewedAt DESC
            """)
    List<UserRecentlyViewed> findRecentByUserIdAndType(
            @Param("userId") UUID userId,
            @Param("itemType") String itemType,
            Pageable pageable
    );

    Optional<UserRecentlyViewed> findByUserIdAndItemTypeAndItemId(UUID userId, String itemType, UUID itemId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM UserRecentlyViewed v WHERE v.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM UserRecentlyViewed v WHERE v.userId = :userId AND v.id = :id")
    void deleteByUserIdAndId(@Param("userId") UUID userId, @Param("id") UUID id);
}
