package com.superapp.location.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.location.dto.CreateCityRequest;
import com.superapp.location.dto.UpdateCityRequest;
import com.superapp.location.mapper.CityMapper;
import com.superapp.store.dto.CityResponse;
import com.superapp.store.entity.City;
import com.superapp.store.enums.CityStatus;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.repository.CityRepository;
import com.superapp.store.repository.StoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CityServiceImpl implements CityService {

    private static final Logger log = LoggerFactory.getLogger(CityServiceImpl.class);

    private final CityRepository cityRepository;
    private final CityMapper cityMapper;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final StoreRepository storeRepository;

    @Autowired
    public CityServiceImpl(CityRepository cityRepository,
                           CityMapper cityMapper,
                           AuditService auditService,
                           ObjectMapper objectMapper,
                           StoreRepository storeRepository) {
        this.cityRepository = cityRepository;
        this.cityMapper = cityMapper;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
        this.storeRepository = storeRepository;
    }

    // Convenience constructor for backward compatibility & tests
    public CityServiceImpl(CityRepository cityRepository,
                           CityMapper cityMapper,
                           AuditService auditService,
                           ObjectMapper objectMapper) {
        this(cityRepository, cityMapper, auditService, objectMapper, null);
    }

    // Convenience constructor for tests
    public CityServiceImpl(CityRepository cityRepository) {
        this(cityRepository, new CityMapper(), null, new ObjectMapper(), null);
    }

    // =========================================================================
    // Discovery (Public)
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "master_cities_active")
    public List<CityResponse> getDiscoveryCities() {
        return cityRepository.findByStatusOrderByNameAsc(CityStatus.ACTIVE)
                .stream()
                .map(cityMapper::toDiscoveryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CityResponse getDiscoveryCityById(String cityId) {
        City city = cityRepository.findById(cityId)
                .orElseThrow(() -> new ResourceNotFoundException("City not found", ApiError.CITY_NOT_FOUND));

        if (!city.isActive()) {
            throw new ResourceNotFoundException("City not found", ApiError.CITY_NOT_FOUND);
        }

        return cityMapper.toDiscoveryResponse(city);
    }

    // =========================================================================
    // Admin Operations
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public List<CityResponse> getAllCitiesAdmin() {
        return cityRepository.findAllByOrderByNameAsc()
                .stream()
                .map(cityMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CityResponse getCityByIdAdmin(String cityId) {
        City city = cityRepository.findById(cityId)
                .orElseThrow(() -> new ResourceNotFoundException("City not found", ApiError.CITY_NOT_FOUND));
        return cityMapper.toResponse(city);
    }

    @Override
    @Transactional
    @CacheEvict(value = "master_cities_active", allEntries = true)
    public CityResponse createCityAdmin(CreateCityRequest request, String adminUserId) {
        String trimmedName = request.name().trim();
        String trimmedState = request.state().trim();

        if (cityRepository.existsByNameIgnoreCaseAndStateIgnoreCase(trimmedName, trimmedState)) {
            throw new DuplicateResourceException("City already exists in state " + trimmedState, ApiError.CITY_ALREADY_EXISTS);
        }

        String slug = generateOrValidateSlug(request.slug(), trimmedName);
        if (cityRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("City slug already exists", ApiError.CITY_ALREADY_EXISTS);
        }

        City city = cityMapper.toEntity(request);
        city.setName(trimmedName);
        city.setState(trimmedState);
        city.setSlug(slug);
        city.setCreatedBy(adminUserId);
        city.setUpdatedBy(adminUserId);

        City saved = cityRepository.save(city);
        log.info("Created city id={} slug='{}' by admin='{}'", saved.getId(), saved.getSlug(), adminUserId);

        recordAudit(AuditEventType.CITY_CREATED, adminUserId, saved.getId(), null, toAuditMap(saved));

        return cityMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "master_cities_active", allEntries = true)
    public CityResponse updateCityAdmin(String cityId, UpdateCityRequest request, String adminUserId) {
        City city = cityRepository.findById(cityId)
                .orElseThrow(() -> new ResourceNotFoundException("City not found", ApiError.CITY_NOT_FOUND));

        Map<String, Object> oldAuditState = toAuditMap(city);

        String trimmedName = request.name().trim();
        String trimmedState = request.state().trim();

        if ((!city.getName().equalsIgnoreCase(trimmedName) || !city.getState().equalsIgnoreCase(trimmedState))
                && cityRepository.existsByNameIgnoreCaseAndStateIgnoreCase(trimmedName, trimmedState)) {
            throw new DuplicateResourceException("City already exists in state " + trimmedState, ApiError.CITY_ALREADY_EXISTS);
        }

        String slug = generateOrValidateSlug(request.slug(), trimmedName);
        if (!slug.equalsIgnoreCase(city.getSlug()) && cityRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("City slug already exists", ApiError.CITY_ALREADY_EXISTS);
        }

        // Apply permitted fields (Mass assignment protection: do NOT change id or status)
        city.setName(trimmedName);
        city.setSlug(slug);
        city.setState(trimmedState);
        if (request.country() != null && !request.country().isBlank()) {
            city.setCountry(request.country().trim());
        }
        city.setUpdatedBy(adminUserId);

        City updated = cityRepository.save(city);
        log.info("Updated city id={} slug='{}' by admin='{}'", updated.getId(), updated.getSlug(), adminUserId);

        recordAudit(AuditEventType.CITY_UPDATED, adminUserId, updated.getId(), oldAuditState, toAuditMap(updated));

        return cityMapper.toResponse(updated);
    }

    @Override
    @Transactional
    @CacheEvict(value = "master_cities_active", allEntries = true)
    public void deactivateCityAdmin(String cityId, String adminUserId) {
        City city = cityRepository.findById(cityId)
                .orElseThrow(() -> new ResourceNotFoundException("City not found", ApiError.CITY_NOT_FOUND));

        if (storeRepository != null && storeRepository.existsByCityIdAndStatus(cityId, StoreStatus.ACTIVE)) {
            throw new AppException("Cannot deactivate city with active stores. Please deactivate or reassign stores first.", ApiError.VALIDATION_FAILED, 400);
        }

        Map<String, Object> oldAuditState = toAuditMap(city);

        // Soft deactivation
        city.setStatus(CityStatus.INACTIVE);
        city.setUpdatedBy(adminUserId);

        City saved = cityRepository.save(city);
        log.info("Deactivated city id={} slug='{}' by admin='{}'", saved.getId(), saved.getSlug(), adminUserId);

        recordAudit(AuditEventType.CITY_DEACTIVATED, adminUserId, saved.getId(), oldAuditState, toAuditMap(saved));
    }

    @Override
    @Transactional
    @CacheEvict(value = "master_cities_active", allEntries = true)
    public CityResponse updateCityStatusAdmin(String cityId, CityStatus status, String adminUserId) {
        City city = cityRepository.findById(cityId)
                .orElseThrow(() -> new ResourceNotFoundException("City not found", ApiError.CITY_NOT_FOUND));

        if (status == CityStatus.INACTIVE && storeRepository != null && storeRepository.existsByCityIdAndStatus(cityId, StoreStatus.ACTIVE)) {
            throw new AppException("Cannot deactivate city with active stores. Please deactivate or reassign stores first.", ApiError.VALIDATION_FAILED, 400);
        }

        Map<String, Object> oldAuditState = toAuditMap(city);

        city.setStatus(status);
        city.setUpdatedBy(adminUserId);

        City saved = cityRepository.save(city);
        log.info("Updated city status id={} status={} by admin='{}'", saved.getId(), saved.getStatus(), adminUserId);

        recordAudit(status == CityStatus.INACTIVE ? AuditEventType.CITY_DEACTIVATED : AuditEventType.CITY_UPDATED,
                adminUserId, saved.getId(), oldAuditState, toAuditMap(saved));

        return cityMapper.toResponse(saved);
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private String generateOrValidateSlug(String providedSlug, String name) {
        if (providedSlug != null && !providedSlug.isBlank()) {
            return providedSlug.trim().toLowerCase()
                    .replaceAll("[^a-z0-9]+", "-")
                    .replaceAll("^-|-$", "");
        }
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private Map<String, Object> toAuditMap(City city) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", city.getId());
        map.put("name", city.getName());
        map.put("slug", city.getSlug());
        map.put("state", city.getState());
        map.put("country", city.getCountry());
        map.put("status", city.getStatus() != null ? city.getStatus().name() : null);
        return map;
    }

    private void recordAudit(AuditEventType eventType, String adminUserId, String entityId,
                             Map<String, Object> oldValue, Map<String, Object> newValue) {
        if (auditService == null) return;
        try {
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("adminUserId", adminUserId);
            metadata.put("entityId", entityId);
            metadata.put("action", eventType.name());
            metadata.put("oldValue", oldValue);
            metadata.put("newValue", newValue);
            metadata.put("timestamp", Instant.now().toString());
            metadata.put("requestId", MDC.get("requestId"));

            UUID userUuid = null;
            if (adminUserId != null) {
                try {
                    userUuid = UUID.fromString(adminUserId);
                } catch (IllegalArgumentException ignored) {
                }
            }

            auditService.record(
                    eventType,
                    userUuid,
                    null,
                    null,
                    MDC.get("requestId"),
                    objectMapper.writeValueAsString(metadata)
            );
        } catch (Exception ex) {
            log.error("Failed to serialize audit metadata for city event: {}", ex.getMessage());
        }
    }
}
