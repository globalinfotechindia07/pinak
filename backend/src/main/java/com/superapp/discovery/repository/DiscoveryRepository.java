package com.superapp.discovery.repository;

import com.superapp.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface DiscoveryRepository extends JpaRepository<Store, UUID> {

    @Query(value = """
            SELECT 
                s.id AS storeId,
                s.merchant_id AS merchantId,
                m.business_name AS merchantName,
                s.store_name AS storeName,
                s.description AS description,
                c.id AS categoryId,
                c.name AS categoryName,
                s.address_line1 AS addressLine1,
                s.address_line2 AS addressLine2,
                s.city_id AS cityId,
                ct.name AS cityName,
                s.state AS state,
                s.pincode AS pincode,
                CAST(s.latitude AS double precision) AS latitude,
                CAST(s.longitude AS double precision) AS longitude,
                ROUND(CAST(
                    6371000 * acos(
                        LEAST(1.0, GREATEST(-1.0,
                            cos(radians(:lat)) * cos(radians(s.latitude)) *
                            cos(radians(s.longitude) - radians(:lng)) +
                            sin(radians(:lat)) * sin(radians(s.latitude))
                        ))
                    ) AS numeric), 1) AS distanceMeters,
                CASE WHEN EXISTS (
                    SELECT 1 FROM offers o 
                    WHERE (o.store_id = s.id OR (o.store_id IS NULL AND o.merchant_id = s.merchant_id))
                    AND o.status = 'ACTIVE'
                    AND :now BETWEEN o.valid_from AND o.valid_to
                ) THEN true ELSE false END AS hasActiveOffers
            FROM stores s
            JOIN merchants m ON s.merchant_id = m.id
            LEFT JOIN categories c ON m.category_id = c.id
            LEFT JOIN cities ct ON s.city_id = ct.id
            WHERE s.approval_status = 'APPROVED'
            AND s.status = 'ACTIVE'
            AND m.approval_status = 'APPROVED'
            AND m.status = 'ACTIVE'
            AND (:categoryId IS NULL OR m.category_id = :categoryId)
            AND (
                6371000 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(:lat)) * cos(radians(s.latitude)) *
                        cos(radians(s.longitude) - radians(:lng)) +
                        sin(radians(:lat)) * sin(radians(s.latitude))
                    ))
                ) <= :radiusMeters
            )
            AND (
                :hasOffer = false OR EXISTS (
                    SELECT 1 FROM offers o 
                    WHERE (o.store_id = s.id OR (o.store_id IS NULL AND o.merchant_id = s.merchant_id))
                    AND o.status = 'ACTIVE'
                    AND :now BETWEEN o.valid_from AND o.valid_to
                )
            )
            ORDER BY 
                CASE WHEN :sortByDistance = true THEN 
                    6371000 * acos(
                        LEAST(1.0, GREATEST(-1.0,
                            cos(radians(:lat)) * cos(radians(s.latitude)) *
                            cos(radians(s.longitude) - radians(:lng)) +
                            sin(radians(:lat)) * sin(radians(s.latitude))
                        ))
                    )
                END ASC,
                s.store_name ASC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<NearbyStoreRow> findNearbyStores(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusMeters") double radiusMeters,
            @Param("categoryId") UUID categoryId,
            @Param("hasOffer") boolean hasOffer,
            @Param("now") Instant now,
            @Param("sortByDistance") boolean sortByDistance,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
            SELECT COUNT(*)
            FROM stores s
            JOIN merchants m ON s.merchant_id = m.id
            LEFT JOIN categories c ON m.category_id = c.id
            WHERE s.approval_status = 'APPROVED'
            AND s.status = 'ACTIVE'
            AND m.approval_status = 'APPROVED'
            AND m.status = 'ACTIVE'
            AND (:categoryId IS NULL OR m.category_id = :categoryId)
            AND (
                6371000 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(:lat)) * cos(radians(s.latitude)) *
                        cos(radians(s.longitude) - radians(:lng)) +
                        sin(radians(:lat)) * sin(radians(s.latitude))
                    ))
                ) <= :radiusMeters
            )
            AND (
                :hasOffer = false OR EXISTS (
                    SELECT 1 FROM offers o 
                    WHERE (o.store_id = s.id OR (o.store_id IS NULL AND o.merchant_id = s.merchant_id))
                    AND o.status = 'ACTIVE'
                    AND :now BETWEEN o.valid_from AND o.valid_to
                )
            )
            """, nativeQuery = true)
    long countNearbyStores(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusMeters") double radiusMeters,
            @Param("categoryId") UUID categoryId,
            @Param("hasOffer") boolean hasOffer,
            @Param("now") Instant now
    );

    @Query(value = """
            SELECT 
                s.id AS storeId,
                s.merchant_id AS merchantId,
                m.business_name AS merchantName,
                s.store_name AS storeName,
                s.description AS description,
                c.id AS categoryId,
                c.name AS categoryName,
                s.address_line1 AS addressLine1,
                s.address_line2 AS addressLine2,
                s.city_id AS cityId,
                ct.name AS cityName,
                s.state AS state,
                s.pincode AS pincode,
                CAST(s.latitude AS double precision) AS latitude,
                CAST(s.longitude AS double precision) AS longitude,
                CASE WHEN :hasCoordinates = true THEN
                    ROUND(CAST(
                        6371000 * acos(
                            LEAST(1.0, GREATEST(-1.0,
                                cos(radians(:lat)) * cos(radians(s.latitude)) *
                                cos(radians(s.longitude) - radians(:lng)) +
                                sin(radians(:lat)) * sin(radians(s.latitude))
                            ))
                        ) AS numeric), 1)
                    ELSE NULL
                END AS distanceMeters,
                CASE WHEN EXISTS (
                    SELECT 1 FROM offers o 
                    WHERE (o.store_id = s.id OR (o.store_id IS NULL AND o.merchant_id = s.merchant_id))
                    AND o.status = 'ACTIVE'
                    AND :now BETWEEN o.valid_from AND o.valid_to
                ) THEN true ELSE false END AS hasActiveOffers
            FROM stores s
            JOIN merchants m ON s.merchant_id = m.id
            LEFT JOIN categories c ON m.category_id = c.id
            LEFT JOIN cities ct ON s.city_id = ct.id
            WHERE s.approval_status = 'APPROVED'
            AND s.status = 'ACTIVE'
            AND m.approval_status = 'APPROVED'
            AND m.status = 'ACTIVE'
            AND (:categoryId IS NULL OR m.category_id = :categoryId)
            AND (
                :q IS NULL OR :q = '' OR
                LOWER(m.business_name) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(s.store_name) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            AND (
                :hasCoordinates = false OR :radiusMeters IS NULL OR
                (6371000 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(:lat)) * cos(radians(s.latitude)) *
                        cos(radians(s.longitude) - radians(:lng)) +
                        sin(radians(:lat)) * sin(radians(s.latitude))
                    ))
                ) <= :radiusMeters)
            )
            ORDER BY 
                CASE WHEN :hasCoordinates = true THEN 
                    6371000 * acos(
                        LEAST(1.0, GREATEST(-1.0,
                            cos(radians(:lat)) * cos(radians(s.latitude)) *
                            cos(radians(s.longitude) - radians(:lng)) +
                            sin(radians(:lat)) * sin(radians(s.latitude))
                        ))
                    )
                END ASC,
                s.store_name ASC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<NearbyStoreRow> searchStores(
            @Param("q") String q,
            @Param("categoryId") UUID categoryId,
            @Param("hasCoordinates") boolean hasCoordinates,
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusMeters") Double radiusMeters,
            @Param("now") Instant now,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
            SELECT COUNT(*)
            FROM stores s
            JOIN merchants m ON s.merchant_id = m.id
            LEFT JOIN categories c ON m.category_id = c.id
            WHERE s.approval_status = 'APPROVED'
            AND s.status = 'ACTIVE'
            AND m.approval_status = 'APPROVED'
            AND m.status = 'ACTIVE'
            AND (:categoryId IS NULL OR m.category_id = :categoryId)
            AND (
                :q IS NULL OR :q = '' OR
                LOWER(m.business_name) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(s.store_name) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            AND (
                :hasCoordinates = false OR :radiusMeters IS NULL OR
                (6371000 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(:lat)) * cos(radians(s.latitude)) *
                        cos(radians(s.longitude) - radians(:lng)) +
                        sin(radians(:lat)) * sin(radians(s.latitude))
                    ))
                ) <= :radiusMeters)
            )
            """, nativeQuery = true)
    long countSearchStores(
            @Param("q") String q,
            @Param("categoryId") UUID categoryId,
            @Param("hasCoordinates") boolean hasCoordinates,
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusMeters") Double radiusMeters
    );
}
