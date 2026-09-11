package com.superapp.discovery;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.discovery.validation.DiscoveryValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DiscoveryValidatorTest {

    private DiscoveryValidator validator;

    @BeforeEach
    void setUp() {
        validator = new DiscoveryValidator(50000.0, 10.0, 100);
    }

    @Test
    @DisplayName("Valid coordinates pass without exception")
    void validCoordinates_pass() {
        assertDoesNotThrow(() -> validator.validateCoordinates(18.5204, 73.8567));
        assertDoesNotThrow(() -> validator.validateCoordinates(0.0, 0.0));
        assertDoesNotThrow(() -> validator.validateCoordinates(-90.0, -180.0));
        assertDoesNotThrow(() -> validator.validateCoordinates(90.0, 180.0));
    }

    @Test
    @DisplayName("Invalid latitude throws AppException with INVALID_COORDINATES")
    void invalidLatitude_throwsException() {
        AppException ex1 = assertThrows(AppException.class, () -> validator.validateCoordinates(90.1, 73.8567));
        assertEquals(ApiError.INVALID_COORDINATES, ex1.getErrorCode());
        assertEquals(400, ex1.getHttpStatus());

        AppException ex2 = assertThrows(AppException.class, () -> validator.validateCoordinates(-91.0, 73.8567));
        assertEquals(ApiError.INVALID_COORDINATES, ex2.getErrorCode());
    }

    @Test
    @DisplayName("Invalid longitude throws AppException with INVALID_COORDINATES")
    void invalidLongitude_throwsException() {
        AppException ex1 = assertThrows(AppException.class, () -> validator.validateCoordinates(18.5204, 180.1));
        assertEquals(ApiError.INVALID_COORDINATES, ex1.getErrorCode());
        assertEquals(400, ex1.getHttpStatus());

        AppException ex2 = assertThrows(AppException.class, () -> validator.validateCoordinates(18.5204, -180.1));
        assertEquals(ApiError.INVALID_COORDINATES, ex2.getErrorCode());
    }

    @Test
    @DisplayName("Null coordinates throw AppException with INVALID_COORDINATES")
    void nullCoordinates_throwsException() {
        AppException ex = assertThrows(AppException.class, () -> validator.validateCoordinates(null, null));
        assertEquals(ApiError.INVALID_COORDINATES, ex.getErrorCode());
    }

    @Test
    @DisplayName("Valid radius passes")
    void validRadius_pass() {
        assertDoesNotThrow(() -> validator.validateRadius(10.0));
        assertDoesNotThrow(() -> validator.validateRadius(5000.0));
        assertDoesNotThrow(() -> validator.validateRadius(50000.0));
        assertDoesNotThrow(() -> validator.validateRadius(null));
    }

    @Test
    @DisplayName("Invalid radius throws AppException with INVALID_RADIUS")
    void invalidRadius_throwsException() {
        AppException exLow = assertThrows(AppException.class, () -> validator.validateRadius(5.0));
        assertEquals(ApiError.INVALID_RADIUS, exLow.getErrorCode());
        assertEquals(400, exLow.getHttpStatus());

        AppException exHigh = assertThrows(AppException.class, () -> validator.validateRadius(50001.0));
        assertEquals(ApiError.INVALID_RADIUS, exHigh.getErrorCode());
    }

    @Test
    @DisplayName("Valid sort fields pass")
    void validSort_pass() {
        assertDoesNotThrow(() -> validator.validateSort("distance"));
        assertDoesNotThrow(() -> validator.validateSort("name"));
        assertDoesNotThrow(() -> validator.validateSort("DISTANCE"));
        assertDoesNotThrow(() -> validator.validateSort(null));
        assertDoesNotThrow(() -> validator.validateSort(""));
    }

    @Test
    @DisplayName("Invalid sort field throws VALIDATION_FAILED")
    void invalidSort_throwsException() {
        AppException ex = assertThrows(AppException.class, () -> validator.validateSort("rating"));
        assertEquals(ApiError.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Page size clamp respects minimum default and max cap")
    void clampPageSize() {
        assertEquals(20, validator.clampPageSize(null));
        assertEquals(20, validator.clampPageSize(0));
        assertEquals(20, validator.clampPageSize(-5));
        assertEquals(50, validator.clampPageSize(50));
        assertEquals(100, validator.clampPageSize(100));
        assertEquals(100, validator.clampPageSize(500));
    }
}
