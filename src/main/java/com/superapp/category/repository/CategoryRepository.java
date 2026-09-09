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

    List<Category> findByParentIsNull();

    List<Category> findByParentId(UUID parentId);

    List<Category> findByStatus(CategoryStatus status);
}
