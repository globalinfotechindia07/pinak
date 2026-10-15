package com.superapp.collection.repository;

import com.superapp.collection.entity.PopularCollection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PopularCollectionRepository extends JpaRepository<PopularCollection, UUID> {

    @Query("""
            SELECT c FROM PopularCollection c
            WHERE c.isActive = TRUE
            ORDER BY c.displayOrder ASC, c.createdAt DESC
            """)
    List<PopularCollection> findActiveCollections(Pageable pageable);
}
