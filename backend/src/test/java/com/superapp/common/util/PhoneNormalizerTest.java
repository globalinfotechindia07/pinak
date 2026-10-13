package com.superapp.common.util;

import com.superapp.common.exception.AppException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class PhoneNormalizerTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "9876543210",
            "+919876543210",
            "+91 98765 43210",
            "+91-98765-43210",
            "09876543210",
            "(+91) 9876543210"
    })
    @DisplayName("Successfully normalizes various Indian phone formats to +919876543210")
    void testNormalize_ValidFormats(String rawPhone) {
        String normalized = PhoneNormalizer.normalize(rawPhone);
        assertEquals("+919876543210", normalized);
        assertEquals("9876543210", PhoneNormalizer.getTenDigits(rawPhone));
        assertTrue(PhoneNormalizer.isValid(rawPhone));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "",
            "   ",
            "12345",
            "5876543210", // starts with 5 (invalid Indian mobile prefix)
            "abcdefghij",
            "+14155552671" // US number (not 10 digits starting with 6-9)
    })
    @DisplayName("Rejects invalid numbers with AppException")
    void testNormalize_InvalidFormats(String invalidPhone) {
        assertThrows(AppException.class, () -> PhoneNormalizer.normalize(invalidPhone));
        assertFalse(PhoneNormalizer.isValid(invalidPhone));
    }

    @Test
    @DisplayName("Correctly masks phone number for PII logging")
    void testMask() {
        assertEquals("+91987****210", PhoneNormalizer.mask("+919876543210"));
        assertEquals("[EMPTY]", PhoneNormalizer.mask(""));
    }
}
