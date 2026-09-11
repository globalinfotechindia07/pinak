package com.superapp.offer.repository;

import com.superapp.offer.entity.Offer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OfferRepository extends JpaRepository<Offer, UUID>, JpaSpecificationExecutor<Offer> {

    Optional<Offer> findByIdAndMerchantId(UUID id, UUID merchantId);

    Page<Offer> findByMerchantId(UUID merchantId, Pageable pageable);

    Page<Offer> findByMerchantIdAndStoreId(UUID merchantId, UUID storeId, Pageable pageable);

    @Query("""
            SELECT o FROM Offer o
            WHERE (o.storeId = :storeId OR (o.storeId IS NULL AND o.merchantId = :merchantId))
            AND o.status = 'ACTIVE'
            AND o.approvalStatus = 'APPROVED'
            AND :now BETWEEN o.validFrom AND o.validTo
            ORDER BY o.value DESC
            """)
    Page<Offer> findActiveOffersByStoreOrMerchant(
            @Param("storeId") UUID storeId,
            @Param("merchantId") UUID merchantId,
            @Param("now") Instant now,
            Pageable pageable
    );

    @Query("""
            SELECT COUNT(o) > 0 FROM Offer o
            WHERE (o.storeId = :storeId OR (o.storeId IS NULL AND o.merchantId = :merchantId))
            AND o.status = 'ACTIVE'
            AND o.approvalStatus = 'APPROVED'
            AND :now BETWEEN o.validFrom AND o.validTo
            """)
    boolean hasActiveOffersForStore(
            @Param("storeId") UUID storeId,
            @Param("merchantId") UUID merchantId,
            @Param("now") Instant now
    );

    long countByStoreId(UUID storeId);
}
