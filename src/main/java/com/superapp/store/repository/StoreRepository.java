package com.superapp.store.repository;

import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.store.entity.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StoreRepository extends JpaRepository<Store, UUID> {

    List<Store> findByMerchantId(UUID merchantId);

    Page<Store> findByMerchantId(UUID merchantId, Pageable pageable);

    Page<Store> findByStatus(ApprovalStatus status, Pageable pageable);

    /**
     * PostgreSQL server-side geospatial distance query for approved stores.
     * Computes distance directly within PostgreSQL using the spherical law of cosines / PostGIS coordinate geometry.
     * Longitude and latitude are handled in standard GIS order.
     */
    @Query(value = """
            SELECT s.* FROM stores s
            WHERE s.status = 'APPROVED'
            AND (
                6371000 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(:lat)) * cos(radians(s.latitude)) *
                        cos(radians(s.longitude) - radians(:lng)) +
                        sin(radians(:lat)) * sin(radians(s.latitude))
                    ))
                )
            ) <= :radiusMeters
            ORDER BY (
                6371000 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(:lat)) * cos(radians(s.latitude)) *
                        cos(radians(s.longitude) - radians(:lng)) +
                        sin(radians(:lat)) * sin(radians(s.latitude))
                    ))
                )
            ) ASC
            """,
            countQuery = """
            SELECT count(*) FROM stores s
            WHERE s.status = 'APPROVED'
            AND (
                6371000 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(:lat)) * cos(radians(s.latitude)) *
                        cos(radians(s.longitude) - radians(:lng)) +
                        sin(radians(:lat)) * sin(radians(s.latitude))
                    ))
                )
            ) <= :radiusMeters
            """,
            nativeQuery = true)
    Page<Store> findNearbyApprovedStores(
            @Param("lat") double latitude,
            @Param("lng") double longitude,
            @Param("radiusMeters") double radiusMeters,
            Pageable pageable
    );
}
