package com.superapp.store.repository;

import com.superapp.store.entity.City;
import com.superapp.store.enums.CityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityRepository extends JpaRepository<City, String> {

    Optional<City> findByNameIgnoreCase(String name);

    boolean existsByIdAndStatus(String id, CityStatus status);

    List<City> findByStatus(CityStatus status);
}
