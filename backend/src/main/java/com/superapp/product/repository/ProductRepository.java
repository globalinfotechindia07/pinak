package com.superapp.product.repository;

import com.superapp.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.inStock = true ORDER BY p.discountPercent DESC, p.createdAt DESC")
    Page<Product> findTopDeals(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.inStock = true AND p.storeId IN :storeIds ORDER BY p.discountPercent DESC")
    Page<Product> findTopDealsByStoreIds(@Param("storeIds") List<UUID> storeIds, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.inStock = true AND p.categoryId = :categoryId ORDER BY p.discountPercent DESC")
    Page<Product> findTopDealsByCategoryId(@Param("categoryId") UUID categoryId, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.isActive = true
            AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
                 OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :q, '%'))
                 OR LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY p.discountPercent DESC
            """)
    List<Product> searchActiveProducts(@Param("q") String q, Pageable pageable);
}
