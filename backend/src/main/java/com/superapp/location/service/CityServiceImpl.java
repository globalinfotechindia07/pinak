package com.superapp.location.service;

import com.fasterxml.jackson.core.type.TypeReference;
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

import java.io.InputStream;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class CityServiceImpl implements CityService {

    private static final Logger log = LoggerFactory.getLogger(CityServiceImpl.class);

    private final CityRepository cityRepository;
    private final CityMapper cityMapper;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final StoreRepository storeRepository;
    private final List<CityService.StateData> indiaLocations = new CopyOnWriteArrayList<>();
    public record PincodeEntry(String state, String district, String city, List<String> postOffices) {}
    private final Map<String, PincodeEntry> pincodeLookupMap = new ConcurrentHashMap<>();

    @Autowired
    public CityServiceImpl(CityRepository cityRepository,
                           CityMapper cityMapper,
                           AuditService auditService,
                           ObjectMapper objectMapper,
                           StoreRepository storeRepository) {
        this.cityRepository = cityRepository;
        this.cityMapper = cityMapper;
        this.auditService = auditService;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.storeRepository = storeRepository;
        loadMasterLocations();
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
        return getDiscoveryCities(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CityResponse> getDiscoveryCities(String state) {
        var stream = cityRepository.findByStatusOrderByNameAsc(CityStatus.ACTIVE).stream();
        if (state != null && !state.isBlank()) {
            stream = stream.filter(c -> c.getState() != null && c.getState().equalsIgnoreCase(state.trim()));
        }
        return stream.map(cityMapper::toDiscoveryResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getDiscoveryStates() {
        Set<String> states = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        for (CityService.StateData s : indiaLocations) {
            if (s.state() != null && !s.state().isBlank()) {
                states.add(s.state().trim());
            }
        }
        if (cityRepository != null) {
            try {
                cityRepository.findByStatusOrderByNameAsc(CityStatus.ACTIVE).forEach(c -> {
                    if (c.getState() != null && !c.getState().isBlank()) {
                        states.add(c.getState().trim());
                    }
                });
            } catch (Exception ignored) {
            }
        }
        if (states.isEmpty()) {
            return List.of("Gujarat", "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", "Rajasthan", "Uttar Pradesh");
        }
        return new ArrayList<>(states);
    }

    @Override
    public List<String> getDistrictsForState(String state) {
        CityService.StateData matchedState = findState(state);
        if (matchedState == null || matchedState.districts() == null) {
            return List.of();
        }
        return matchedState.districts().stream()
                .map(CityService.DistrictData::name)
                .filter(n -> n != null && !n.isBlank())
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    @Override
    public List<String> getCitiesForDistrictOrState(String state, String district) {
        CityService.StateData matchedState = findState(state);
        if (matchedState == null || matchedState.districts() == null) {
            return List.of();
        }

        if (district != null && !district.isBlank()) {
            CityService.DistrictData matchedDistrict = findDistrict(matchedState, district);
            if (matchedDistrict != null && matchedDistrict.cities() != null && !matchedDistrict.cities().isEmpty()) {
                return matchedDistrict.cities().stream()
                        .distinct()
                        .sorted(String.CASE_INSENSITIVE_ORDER)
                        .toList();
            }
        }

        // Fallback: return all cities from all districts in this state
        Set<String> allCities = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        for (CityService.DistrictData d : matchedState.districts()) {
            if (d.cities() != null) {
                allCities.addAll(d.cities());
            }
        }
        return new ArrayList<>(allCities);
    }

    @Override
    public CityService.PincodeLookupResponse lookupPincode(String pincode) {
        if (pincode == null || pincode.isBlank()) {
            return new CityService.PincodeLookupResponse(pincode, null, null, null, List.of(), List.of());
        }

        String clean = pincode.trim().replaceAll("\\D", "");
        if (clean.length() != 6) {
            return new CityService.PincodeLookupResponse(pincode, null, null, null, List.of(), List.of());
        }

        PincodeEntry entry = pincodeLookupMap.get(clean);
        if (entry != null) {
            List<String> availableDistricts = getDistrictsForState(entry.state());
            List<String> availableCities = getCitiesForDistrictOrState(entry.state(), entry.district());
            return new CityService.PincodeLookupResponse(
                    clean,
                    entry.state(),
                    entry.district(),
                    entry.city(),
                    availableDistricts,
                    availableCities
            );
        }

        String state = resolveStateFromPincode(clean);
        String district = resolveDistrictFromPincode(clean, state);
        String city = resolveCityFromPincode(clean, state, district);

        List<String> availableDistricts = state != null ? getDistrictsForState(state) : List.of();
        List<String> availableCities = (state != null && district != null)
                ? getCitiesForDistrictOrState(state, district)
                : List.of();

        if (city == null && !availableCities.isEmpty()) {
            city = availableCities.get(0);
        }

        return new CityService.PincodeLookupResponse(
                clean,
                state,
                district,
                city,
                availableDistricts,
                availableCities
        );
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

    private void loadMasterLocations() {
        try (InputStream is = getClass().getResourceAsStream("/data/india_locations.json")) {
            if (is != null) {
                List<CityService.StateData> loaded = objectMapper.readValue(
                        is,
                        new TypeReference<List<CityService.StateData>>() {}
                );
                indiaLocations.clear();
                if (loaded != null) {
                    indiaLocations.addAll(loaded);
                }
                log.info("Loaded {} Indian states from master location dataset", indiaLocations.size());
            } else {
                log.warn("Master india_locations.json not found in classpath /data/india_locations.json");
            }
        } catch (Exception e) {
            log.warn("Could not load /data/india_locations.json: {}", e.getMessage());
        }

        try (InputStream is = getClass().getResourceAsStream("/data/pincode_lookup.json")) {
            if (is != null) {
                Map<String, PincodeEntry> loaded = objectMapper.readValue(
                        is,
                        new TypeReference<Map<String, PincodeEntry>>() {}
                );
                pincodeLookupMap.clear();
                if (loaded != null) {
                    pincodeLookupMap.putAll(loaded);
                }
                log.info("Loaded {} Indian PIN codes from master postal directory", pincodeLookupMap.size());
            } else {
                log.warn("Master pincode_lookup.json not found in classpath /data/pincode_lookup.json");
            }
        } catch (Exception e) {
            log.warn("Could not load /data/pincode_lookup.json: {}", e.getMessage());
        }
    }

    private CityService.StateData findState(String state) {
        if (state == null || state.isBlank()) return null;
        String query = state.trim().toLowerCase();
        // 1. Exact match
        for (CityService.StateData s : indiaLocations) {
            if (s.state() != null && s.state().equalsIgnoreCase(query)) {
                return s;
            }
        }
        // 2. Contains match (e.g. "Delhi" -> "Delhi (NCT)")
        for (CityService.StateData s : indiaLocations) {
            if (s.state() != null) {
                String norm = s.state().trim().toLowerCase();
                if (norm.contains(query) || query.contains(norm)) {
                    return s;
                }
            }
        }
        return null;
    }

    private CityService.DistrictData findDistrict(CityService.StateData stateData, String district) {
        if (stateData == null || stateData.districts() == null || district == null || district.isBlank()) return null;
        String query = district.trim().toLowerCase();
        // 1. Exact match
        for (CityService.DistrictData d : stateData.districts()) {
            if (d.name() != null && d.name().equalsIgnoreCase(query)) {
                return d;
            }
        }
        // 2. Contains match
        for (CityService.DistrictData d : stateData.districts()) {
            if (d.name() != null) {
                String norm = d.name().trim().toLowerCase();
                if (norm.contains(query) || query.contains(norm)) {
                    return d;
                }
            }
        }
        return null;
    }

    private String resolveStateFromPincode(String pin) {
        try {
            int prefix2 = Integer.parseInt(pin.substring(0, 2));
            int prefix3 = Integer.parseInt(pin.substring(0, 3));

            if (prefix3 == 403) return "Goa";
            if (prefix3 == 160) return "Chandigarh";
            if (prefix2 == 11) return "Delhi (NCT)";
            if (prefix2 >= 12 && prefix2 <= 13) return "Haryana";
            if (prefix2 >= 14 && prefix2 <= 15) return "Punjab";
            if (prefix2 == 16) return "Punjab";
            if (prefix2 == 17) return "Himachal Pradesh";
            if (prefix2 >= 18 && prefix2 <= 19) return "Jammu and Kashmir";
            if (prefix2 >= 20 && prefix2 <= 28) {
                if (prefix3 >= 244 && prefix3 <= 249) return "Uttarakhand";
                return "Uttar Pradesh";
            }
            if (prefix2 >= 30 && prefix2 <= 34) return "Rajasthan";
            if (prefix2 >= 36 && prefix2 <= 39) return "Gujarat";
            if (prefix2 >= 40 && prefix2 <= 44) return "Maharashtra";
            if (prefix2 >= 45 && prefix2 <= 49) {
                if (prefix3 >= 490 && prefix3 <= 497) return "Chhattisgarh";
                return "Madhya Pradesh";
            }
            if (prefix2 >= 50 && prefix2 <= 53) {
                if (prefix2 <= 50) return "Telangana";
                return "Andhra Pradesh";
            }
            if (prefix2 >= 56 && prefix2 <= 59) return "Karnataka";
            if (prefix2 >= 60 && prefix2 <= 64) return "Tamil Nadu";
            if (prefix2 >= 67 && prefix2 <= 69) return "Kerala";
            if (prefix2 >= 70 && prefix2 <= 74) return "West Bengal";
            if (prefix2 >= 75 && prefix2 <= 77) return "Odisha";
            if (prefix2 == 78) return "Assam";
            if (prefix2 >= 80 && prefix2 <= 85) {
                if (prefix3 >= 814 && prefix3 <= 835) return "Jharkhand";
                return "Bihar";
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String resolveDistrictFromPincode(String pin, String state) {
        if (state == null) return null;
        try {
            int prefix2 = Integer.parseInt(pin.substring(0, 2));
            int prefix3 = Integer.parseInt(pin.substring(0, 3));

            switch (state) {
                case "Gujarat":
                    if (prefix2 == 38) return "Ahmedabad";
                    if (prefix2 == 39) return "Surat";
                    if (prefix2 == 36) return "Rajkot";
                    if (prefix2 == 37) return "Jamnagar";
                    return "Ahmedabad";
                case "Maharashtra":
                    if (prefix3 == 400) return "Mumbai City";
                    if (prefix3 == 401) return "Thane";
                    if (prefix3 >= 410 && prefix3 <= 413) return "Pune";
                    if (prefix3 == 422) return "Nashik";
                    if (prefix3 >= 440 && prefix3 <= 441) return "Nagpur";
                    if (prefix3 == 444) return "Amravati";
                    if (prefix3 == 416) return "Kolhapur";
                    if (prefix3 == 431) return "Chhatrapati Sambhaji Nagar (Aurangabad)";
                    return "Nagpur";
                case "Delhi (NCT)":
                    return "New Delhi";
                case "Karnataka":
                    if (prefix2 == 56) return "Bangalore Urban";
                    if (prefix2 == 57) return "Mangalore";
                    return "Bangalore Urban";
                case "Tamil Nadu":
                    if (prefix2 == 60) return "Chennai";
                    if (prefix2 == 64) return "Coimbatore";
                    if (prefix2 == 62) return "Madurai";
                    return "Chennai";
                case "Telangana":
                    return "Hyderabad";
                case "Rajasthan":
                    if (prefix2 == 30) return "Jaipur";
                    if (prefix2 == 34) return "Jodhpur";
                    if (prefix2 == 31) return "Udaipur";
                    return "Jaipur";
                case "West Bengal":
                    if (prefix2 == 70) return "Kolkata";
                    return "Kolkata";
                case "Uttar Pradesh":
                    if (prefix3 == 201) return "Noida";
                    if (prefix2 == 22) return "Lucknow";
                    if (prefix2 == 20) return "Kanpur";
                    return "Lucknow";
                case "Madhya Pradesh":
                    if (prefix2 == 45) return "Indore";
                    if (prefix2 == 46) return "Bhopal";
                    return "Indore";
                case "Kerala":
                    if (prefix2 == 68) return "Kochi";
                    if (prefix2 == 69) return "Thiruvananthapuram";
                    return "Kochi";
                default:
                    List<String> districts = getDistrictsForState(state);
                    return districts.isEmpty() ? null : districts.get(0);
            }
        } catch (Exception ignored) {
            List<String> districts = getDistrictsForState(state);
            return districts.isEmpty() ? null : districts.get(0);
        }
    }

    private String resolveCityFromPincode(String pin, String state, String district) {
        if (state == null || district == null) return null;
        List<String> cities = getCitiesForDistrictOrState(state, district);
        if (cities.isEmpty()) return null;

        for (String c : cities) {
            if (c.equalsIgnoreCase(district)) {
                return c;
            }
        }
        return cities.get(0);
    }

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
