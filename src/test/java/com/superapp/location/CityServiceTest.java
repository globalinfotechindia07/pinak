package com.superapp.location;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.location.dto.CreateCityRequest;
import com.superapp.location.dto.UpdateCityRequest;
import com.superapp.location.mapper.CityMapper;
import com.superapp.location.service.CityServiceImpl;
import com.superapp.store.dto.CityResponse;
import com.superapp.store.entity.City;
import com.superapp.store.enums.CityStatus;
import com.superapp.store.repository.CityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CityServiceTest {

    @Mock
    private CityRepository cityRepository;

    @Spy
    private CityMapper cityMapper = new CityMapper();

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private CityServiceImpl cityService;

    private City activeCity;

    @BeforeEach
    void setUp() {
        activeCity = new City("city_123", "Nagpur", "nagpur", "Maharashtra", "India", CityStatus.ACTIVE);
    }

    @Test
    @DisplayName("Create city succeeds")
    void createCity_success() {
        CreateCityRequest request = new CreateCityRequest("Nagpur", "nagpur", "Maharashtra", "India");

        when(cityRepository.existsByNameIgnoreCaseAndStateIgnoreCase("Nagpur", "Maharashtra")).thenReturn(false);
        when(cityRepository.existsBySlug("nagpur")).thenReturn(false);
        when(cityRepository.save(any(City.class))).thenAnswer(inv -> inv.getArgument(0));

        CityResponse response = cityService.createCityAdmin(request, "admin_user");

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Nagpur");
        assertThat(response.slug()).isEqualTo("nagpur");
        assertThat(response.state()).isEqualTo("Maharashtra");
        verify(cityRepository).save(any(City.class));
    }

    @Test
    @DisplayName("Create city with duplicate name and state throws DuplicateResourceException")
    void createCity_duplicateNameAndState_throwsException() {
        CreateCityRequest request = new CreateCityRequest("Nagpur", "nagpur-east", "Maharashtra", "India");
        when(cityRepository.existsByNameIgnoreCaseAndStateIgnoreCase("Nagpur", "Maharashtra")).thenReturn(true);

        assertThatThrownBy(() -> cityService.createCityAdmin(request, "admin_user"))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    @DisplayName("Create city with duplicate slug throws DuplicateResourceException")
    void createCity_duplicateSlug_throwsException() {
        CreateCityRequest request = new CreateCityRequest("Nagpur Metro", "nagpur", "Maharashtra", "India");
        when(cityRepository.existsByNameIgnoreCaseAndStateIgnoreCase("Nagpur Metro", "Maharashtra")).thenReturn(false);
        when(cityRepository.existsBySlug("nagpur")).thenReturn(true);

        assertThatThrownBy(() -> cityService.createCityAdmin(request, "admin_user"))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    @DisplayName("Get discovery cities returns only active cities")
    void getDiscoveryCities_success() {
        when(cityRepository.findByStatusOrderByNameAsc(CityStatus.ACTIVE))
                .thenReturn(List.of(activeCity));

        List<CityResponse> responses = cityService.getDiscoveryCities();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).name()).isEqualTo("Nagpur");
        assertThat(responses.get(0).slug()).isEqualTo("nagpur");
    }

    @Test
    @DisplayName("Get discovery city by ID returns city when active")
    void getDiscoveryCityById_active_success() {
        when(cityRepository.findById("city_123")).thenReturn(Optional.of(activeCity));

        CityResponse response = cityService.getDiscoveryCityById("city_123");

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo("city_123");
    }

    @Test
    @DisplayName("Get discovery city by ID throws 404 when city is inactive")
    void getDiscoveryCityById_inactive_throwsNotFound() {
        activeCity.setStatus(CityStatus.INACTIVE);
        when(cityRepository.findById("city_123")).thenReturn(Optional.of(activeCity));

        assertThatThrownBy(() -> cityService.getDiscoveryCityById("city_123"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Update city succeeds")
    void updateCity_success() {
        UpdateCityRequest request = new UpdateCityRequest("Nagpur Smart City", "nagpur-smart", "Maharashtra", "India");
        when(cityRepository.findById("city_123")).thenReturn(Optional.of(activeCity));
        when(cityRepository.existsByNameIgnoreCaseAndStateIgnoreCase("Nagpur Smart City", "Maharashtra")).thenReturn(false);
        when(cityRepository.existsBySlug("nagpur-smart")).thenReturn(false);
        when(cityRepository.save(any(City.class))).thenAnswer(inv -> inv.getArgument(0));

        CityResponse response = cityService.updateCityAdmin("city_123", request, "admin_user");

        assertThat(response.name()).isEqualTo("Nagpur Smart City");
        assertThat(response.slug()).isEqualTo("nagpur-smart");
    }

    @Test
    @DisplayName("Deactivate city logically sets status to INACTIVE")
    void deactivateCity_success() {
        when(cityRepository.findById("city_123")).thenReturn(Optional.of(activeCity));
        when(cityRepository.save(any(City.class))).thenAnswer(inv -> inv.getArgument(0));

        cityService.deactivateCityAdmin("city_123", "admin_user");

        assertThat(activeCity.getStatus()).isEqualTo(CityStatus.INACTIVE);
        assertThat(activeCity.getUpdatedBy()).isEqualTo("admin_user");
        verify(cityRepository).save(activeCity);
    }
}
