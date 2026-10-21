package com.superapp.store.repository;

import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.StoreStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreRepository extends JpaRepository<Store, UUID> {

    List<Store> findByMerchantId(UUID merchantId);

    @Query("SELECT s FROM Store s WHERE s.phone IS NOT NULL AND (s.phone = :phone OR s.phone LIKE CONCAT('%', :last10))")
    List<Store> findByPhoneOrSuffix(@Param("phone") String phone, @Param("last10") String last10);

    boolean existsByPhone(String phone);

    Page<Store> findByMerchantId(UUID merchantId, Pageable pageable);

    Optional<Store> findByIdAndMerchantId(UUID id, UUID merchantId);

    Page<Store> findByMerchantIdAndStatus(UUID merchantId, StoreStatus status, Pageable pageable);

    Page<Store> findByMerchantIdAndApprovalStatus(UUID merchantId, ApprovalStatus approvalStatus, Pageable pageable);

    Page<Store> findByMerchantIdAndStatusAndApprovalStatus(
            UUID merchantId, StoreStatus status, ApprovalStatus approvalStatus, Pageable pageable);

    Page<Store> findByApprovalStatus(ApprovalStatus approvalStatus, Pageable pageable);

    Page<Store> findByStatus(StoreStatus status, Pageable pageable);

    @Query("""
            SELECT s FROM Store s
            WHERE s.approvalStatus = com.superapp.merchant.entity.ApprovalStatus.APPROVED
            AND s.status = com.superapp.store.enums.StoreStatus.ACTIVE
            ORDER BY s.createdAt DESC
            """)
    Page<Store> findNewlyAddedApprovedStores(Pageable pageable);

    @Query("""
            SELECT s FROM Store s
            WHERE (:status IS NULL OR s.status = :status)
            AND (:approvalStatus IS NULL OR s.approvalStatus = :approvalStatus)
            AND (:cityId IS NULL OR s.cityId = :cityId)
            """)
    Page<Store> findAllAdmin(
            @Param("status") StoreStatus status,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("cityId") String cityId,
            Pageable pageable
    );

    /**
     * Geospatial query for approved stores within radius.
     * Longitude and latitude handled in standard GIS order.
     */
    @Query(value = """
            SELECT s.* FROM stores s
            WHERE s.approval_status = 'APPROVED' AND s.status = 'ACTIVE'
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
            WHERE s.approval_status = 'APPROVED' AND s.status = 'ACTIVE'
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

    @Query(value = """
            SELECT s.* FROM stores s
            WHERE s.approval_status = 'APPROVED' AND s.status = 'ACTIVE'
            AND s.rating >= :minRating
            AND (
                6371000 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(:lat)) * cos(radians(s.latitude)) *
                        cos(radians(s.longitude) - radians(:lng)) +
                        sin(radians(:lat)) * sin(radians(s.latitude))
                    ))
                )
            ) <= :radiusMeters
            ORDER BY s.rating DESC, (
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
            WHERE s.approval_status = 'APPROVED' AND s.status = 'ACTIVE'
            AND s.rating >= :minRating
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
    Page<Store> findNearbyApprovedStoresWithMinRating(
            @Param("lat") double latitude,
            @Param("lng") double longitude,
            @Param("radiusMeters") double radiusMeters,
            @Param("minRating") double minRating,
            Pageable pageable
    );

    long countByApprovalStatus(ApprovalStatus approvalStatus);

    long countByStatus(StoreStatus status);

    boolean existsByCityIdAndStatus(String cityId, StoreStatus status);

    @Query("""
            SELECT s FROM Store s
            WHERE s.approvalStatus = com.superapp.merchant.entity.ApprovalStatus.APPROVED
            AND s.status = com.superapp.store.enums.StoreStatus.ACTIVE
            AND (LOWER(s.storeName) LIKE LOWER(CONCAT('%', :q, '%'))
                 OR LOWER(s.cuisineOrCategory) LIKE LOWER(CONCAT('%', :q, '%'))
                 OR LOWER(s.address) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY s.rating DESC, s.storeName ASC
            """)
    List<Store> searchActiveStores(@Param("q") String q, Pageable pageable);
}
