package com.superapp.category.repository;

import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Category> findByParentIsNull();

    List<Category> findByParentId(UUID parentId);

    List<Category> findByStatus(CategoryStatus status);

    List<Category> findByParentIsNullAndStatusOrderByDisplayOrderAsc(CategoryStatus status);

    List<Category> findByParentIdAndStatusOrderByDisplayOrderAsc(UUID parentId, CategoryStatus status);

    List<Category> findByStatusOrderByDisplayOrderAsc(CategoryStatus status);

    List<Category> findAllByOrderByDisplayOrderAsc();

    @org.springframework.data.jpa.repository.Query("""
            SELECT c FROM Category c
            WHERE c.status = com.superapp.category.entity.CategoryStatus.ACTIVE
            AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%'))
                 OR LOWER(c.slug) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY c.displayOrder ASC
            """)
    List<Category> searchActiveCategories(@org.springframework.data.repository.query.Param("q") String q, org.springframework.data.domain.Pageable pageable);
}
